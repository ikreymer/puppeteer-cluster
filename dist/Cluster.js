"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Job_1 = require("./Job");
const Display_1 = require("./Display");
const util = require("./util");
const Worker_1 = require("./Worker");
const builtInConcurrency = require("./concurrency/builtInConcurrency");
const Queue_1 = require("./Queue");
const SystemMonitor_1 = require("./SystemMonitor");
const events_1 = require("events");
const debug = util.debugGenerator('Cluster');
const DEFAULT_OPTIONS = {
    concurrency: 2,
    maxConcurrency: 1,
    workerCreationDelay: 0,
    puppeteerOptions: {
    // headless: false, // just for testing...
    },
    perBrowserOptions: undefined,
    monitor: false,
    timeout: 30 * 1000,
    retryLimit: 0,
    retryDelay: 0,
    skipDuplicateUrls: false,
    sameDomainDelay: 0,
    puppeteer: undefined,
};
const MONITORING_DISPLAY_INTERVAL = 500;
const CHECK_FOR_WORK_INTERVAL = 100;
const WORK_CALL_INTERVAL_LIMIT = 10;
class Cluster extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.perBrowserOptions = null;
        this.workers = [];
        this.workersAvail = [];
        this.workersBusy = [];
        this.workersStarting = 0;
        this.allTargetCount = 0;
        this.jobQueue = new Queue_1.default();
        this.errorCount = 0;
        this.taskFunction = null;
        this.idleResolvers = [];
        this.waitForOneResolvers = [];
        this.browser = null;
        this.isClosed = false;
        this.startTime = Date.now();
        this.nextWorkerId = -1;
        this.monitoringInterval = null;
        this.display = null;
        this.duplicateCheckUrls = new Set();
        this.lastDomainAccesses = new Map();
        this.systemMonitor = new SystemMonitor_1.default();
        this.checkForWorkInterval = null;
        this.nextWorkCall = 0;
        this.workCallTimeout = null;
        this.lastLaunchedWorkerTime = 0;
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
        if (this.options.monitor) {
            this.monitoringInterval = setInterval(() => this.monitor(), MONITORING_DISPLAY_INTERVAL);
        }
    }
    static async launch(options) {
        debug('Launching');
        const cluster = new Cluster(options);
        await cluster.init();
        return cluster;
    }
    async init() {
        const browserOptions = this.options.puppeteerOptions;
        let puppeteer = this.options.puppeteer;
        if (this.options.puppeteer == null) { // check for null or undefined
            puppeteer = require('puppeteer');
        }
        else {
            debug('Using provided (custom) puppteer object.');
        }
        if (this.options.concurrency === Cluster.CONCURRENCY_PAGE) {
            this.browser = new builtInConcurrency.Page(browserOptions, puppeteer);
        }
        else if (this.options.concurrency === Cluster.CONCURRENCY_CONTEXT) {
            this.browser = new builtInConcurrency.Context(browserOptions, puppeteer);
        }
        else if (this.options.concurrency === Cluster.CONCURRENCY_BROWSER) {
            this.browser = new builtInConcurrency.Browser(browserOptions, puppeteer);
        }
        else if (typeof this.options.concurrency === 'function') {
            this.browser = new this.options.concurrency(browserOptions, puppeteer);
        }
        else {
            throw new Error(`Unknown concurrency option: ${this.options.concurrency}`);
        }
        if (typeof this.options.maxConcurrency !== 'number') {
            throw new Error('maxConcurrency must be of number type');
        }
        if (this.options.perBrowserOptions
            && this.options.perBrowserOptions.length !== this.options.maxConcurrency) {
            throw new Error('perBrowserOptions length must equal maxConcurrency');
        }
        if (this.options.perBrowserOptions) {
            this.perBrowserOptions = [...this.options.perBrowserOptions];
        }
        try {
            await this.browser.init();
        }
        catch (err) {
            throw new Error(`Unable to launch browser, error message: ${err.message}`);
        }
        if (this.options.monitor) {
            await this.systemMonitor.init();
        }
        // needed in case resources are getting free (like CPU/memory) to check if
        // can launch workers
        this.checkForWorkInterval = setInterval(() => this.work(), CHECK_FOR_WORK_INTERVAL);
    }
    async launchWorker() {
        // signal, that we are starting a worker
        this.workersStarting += 1;
        this.nextWorkerId += 1;
        this.lastLaunchedWorkerTime = Date.now();
        let nextWorkerOption;
        if (this.perBrowserOptions && this.perBrowserOptions.length > 0) {
            nextWorkerOption = this.perBrowserOptions.shift();
        }
        const workerId = this.nextWorkerId;
        let workerBrowserInstance;
        try {
            workerBrowserInstance = await this.browser
                .workerInstance(nextWorkerOption);
        }
        catch (err) {
            throw new Error(`Unable to launch browser for worker, error message: ${err.message}`);
        }
        const worker = new Worker_1.default({
            cluster: this,
            args: [''],
            browser: workerBrowserInstance,
            id: workerId,
        });
        this.workersStarting -= 1;
        if (this.isClosed) {
            // cluster was closed while we created a new worker (should rarely happen)
            worker.close();
        }
        else {
            this.workersAvail.push(worker);
            this.workers.push(worker);
        }
    }
    async task(taskFunction) {
        this.taskFunction = taskFunction;
    }
    // check for new work soon (wait if there will be put more data into the queue, first)
    async work() {
        // make sure, we only call work once every WORK_CALL_INTERVAL_LIMIT (currently: 10ms)
        if (this.workCallTimeout === null) {
            const now = Date.now();
            // calculate when the next work call should happen
            this.nextWorkCall = Math.max(this.nextWorkCall + WORK_CALL_INTERVAL_LIMIT, now);
            const timeUntilNextWorkCall = this.nextWorkCall - now;
            this.workCallTimeout = setTimeout(() => {
                this.workCallTimeout = null;
                this.doWork();
            }, timeUntilNextWorkCall);
        }
    }
    async doWork() {
        const sizeRes = await this.jobQueue.size();
        if (sizeRes === 0) { // no jobs available
            if (await this.jobQueue.numPending(this.workersBusy.length) === 0) {
                this.idleResolvers.forEach(resolve => resolve());
            }
            return;
        }
        if (this.workersAvail.length === 0) { // no workers available
            if (this.allowedToStartWorker()) {
                await this.launchWorker();
                this.work();
            }
            return;
        }
        const job = await this.jobQueue.shift();
        if (job === undefined) {
            // skip, there are items in the queue but they are all delayed
            return;
        }
        const url = job.getUrl();
        const domain = job.getDomain();
        // Check if URL was already crawled (on skipDuplicateUrls)
        if (this.options.skipDuplicateUrls
            && url !== undefined && this.duplicateCheckUrls.has(url)) {
            // already crawled, just ignore
            debug(`Skipping duplicate URL: ${job.getUrl()}`);
            this.work();
            return;
        }
        // Check if the job needs to be delayed due to sameDomainDelay
        if (this.options.sameDomainDelay !== 0 && domain !== undefined) {
            const lastDomainAccess = this.lastDomainAccesses.get(domain);
            if (lastDomainAccess !== undefined
                && lastDomainAccess + this.options.sameDomainDelay > Date.now()) {
                await this.jobQueue.push(job, {
                    delayUntil: lastDomainAccess + this.options.sameDomainDelay,
                });
                this.work();
                return;
            }
        }
        // Check are all positive, let's actually run the job
        if (this.options.skipDuplicateUrls && url !== undefined) {
            this.duplicateCheckUrls.add(url);
        }
        if (this.options.sameDomainDelay !== 0 && domain !== undefined) {
            this.lastDomainAccesses.set(domain, Date.now());
        }
        const worker = this.workersAvail.shift();
        this.workersBusy.push(worker);
        if (this.workersAvail.length !== 0 || this.allowedToStartWorker()) {
            // we can execute more work in parallel
            this.work();
        }
        let jobFunction;
        if (job.taskFunction !== undefined) {
            jobFunction = job.taskFunction;
        }
        else if (this.taskFunction !== null) {
            jobFunction = this.taskFunction;
        }
        else {
            throw new Error('No task function defined!');
        }
        const result = await worker.handle(jobFunction, job, this.options.timeout);
        if (result.type === 'error') {
            if (job.executeCallbacks) {
                job.executeCallbacks.reject(result.error);
                this.errorCount += 1;
            }
            else { // ignore retryLimits in case of executeCallbacks
                job.addError(result.error);
                const jobWillRetry = job.tries <= this.options.retryLimit;
                this.emit('taskerror', result.error, job.data, jobWillRetry);
                if (jobWillRetry) {
                    let delayUntil = undefined;
                    if (this.options.retryDelay !== 0) {
                        delayUntil = Date.now() + this.options.retryDelay;
                    }
                    await this.jobQueue.push(job, {
                        delayUntil,
                    });
                }
                else {
                    this.errorCount += 1;
                }
            }
        }
        else if (result.type === 'success' && job.executeCallbacks) {
            job.executeCallbacks.resolve(result.data);
        }
        this.waitForOneResolvers.forEach(resolve => resolve(job.data));
        this.waitForOneResolvers = [];
        // add worker to available workers again
        const workerIndex = this.workersBusy.indexOf(worker);
        this.workersBusy.splice(workerIndex, 1);
        this.workersAvail.push(worker);
        this.work();
    }
    allowedToStartWorker() {
        const workerCount = this.workers.length + this.workersStarting;
        return (
        // option: maxConcurrency
        (this.options.maxConcurrency === 0
            || workerCount < this.options.maxConcurrency)
            // just allow worker creaton every few milliseconds
            && (this.options.workerCreationDelay === 0
                || this.lastLaunchedWorkerTime + this.options.workerCreationDelay < Date.now()));
    }
    // Type Guard for TypeScript
    isTaskFunction(data) {
        return (typeof data === 'function');
    }
    queueJob(data, taskFunction, callbacks) {
        let realData;
        let realFunction;
        if (this.isTaskFunction(data)) {
            realFunction = data;
        }
        else {
            realData = data;
            realFunction = taskFunction;
        }
        const job = new Job_1.default(realData, realFunction, callbacks);
        //this.allTargetCount += 1;
        this.jobQueue.push(job);
        this.emit('queue', realData, realFunction);
        this.work();
    }
    async queue(data, taskFunction) {
        this.queueJob(data, taskFunction);
    }
    execute(data, taskFunction) {
        return new Promise((resolve, reject) => {
            const callbacks = { resolve, reject };
            this.queueJob(data, taskFunction, callbacks);
        });
    }
    idle() {
        return new Promise(resolve => this.idleResolvers.push(resolve));
    }
    waitForOne() {
        return new Promise(resolve => this.waitForOneResolvers.push(resolve));
    }
    async close() {
        this.isClosed = true;
        clearInterval(this.checkForWorkInterval);
        clearTimeout(this.workCallTimeout);
        // close workers
        await Promise.all(this.workers.map(worker => worker.close()));
        try {
            await this.browser.close();
        }
        catch (err) {
            debug(`Error: Unable to close browser, message: ${err.message}`);
        }
        if (this.monitoringInterval) {
            await this.monitor();
            clearInterval(this.monitoringInterval);
        }
        if (this.display) {
            this.display.close();
        }
        this.systemMonitor.close();
        debug('Closed');
    }
    async monitor() {
        if (!this.display) {
            this.display = new Display_1.default();
        }
        const display = this.display;
        const now = Date.now();
        const timeDiff = now - this.startTime;
        this.allTargetCount = await this.jobQueue.numSeen();
        const doneTargets = this.allTargetCount - (await this.jobQueue.size()) - (await this.jobQueue.numPending(this.workersBusy.length));
        const donePercentage = this.allTargetCount === 0
            ? 1 : (doneTargets / this.allTargetCount);
        const donePercStr = (100 * donePercentage).toFixed(2);
        const errorPerc = doneTargets === 0 ?
            '0.00' : (100 * this.errorCount / doneTargets).toFixed(2);
        const timeRunning = util.formatDuration(timeDiff);
        let timeRemainingMillis = -1;
        if (donePercentage !== 0) {
            timeRemainingMillis = ((timeDiff) / donePercentage) - timeDiff;
        }
        const timeRemining = util.formatDuration(timeRemainingMillis);
        const cpuUsage = this.systemMonitor.getCpuUsage().toFixed(1);
        const memoryUsage = this.systemMonitor.getMemoryUsage().toFixed(1);
        const pagesPerSecond = doneTargets === 0 ?
            '0' : (doneTargets * 1000 / timeDiff).toFixed(2);
        display.log(`== Start:     ${util.formatDateTime(this.startTime)}`);
        display.log(`== Now:       ${util.formatDateTime(now)} (running for ${timeRunning})`);
        display.log(`== Progress:  ${doneTargets} / ${this.allTargetCount} (${donePercStr}%)`
            + `, errors: ${this.errorCount} (${errorPerc}%)`);
        display.log(`== Remaining: ${timeRemining} (@ ${pagesPerSecond} pages/second)`);
        display.log(`== Sys. load: ${cpuUsage}% CPU / ${memoryUsage}% memory`);
        display.log(`== Workers:   ${this.workers.length + this.workersStarting}`);
        this.workers.forEach((worker, i) => {
            const isIdle = this.workersAvail.indexOf(worker) !== -1;
            let workOrIdle;
            let workerUrl = '';
            if (isIdle) {
                workOrIdle = 'IDLE';
            }
            else {
                workOrIdle = 'WORK';
                if (worker.activeTarget) {
                    workerUrl = worker.activeTarget.getUrl() || 'UNKNOWN TARGET';
                }
                else {
                    workerUrl = 'NO TARGET (should not be happening)';
                }
            }
            display.log(`   #${i} ${workOrIdle} ${workerUrl}`);
        });
        for (let i = 0; i < this.workersStarting; i += 1) {
            display.log(`   #${this.workers.length + i} STARTING...`);
        }
        display.resetCursor();
    }
}
exports.default = Cluster;
Cluster.CONCURRENCY_PAGE = 1; // shares cookies, etc.
Cluster.CONCURRENCY_CONTEXT = 2; // no cookie sharing (uses contexts)
Cluster.CONCURRENCY_BROWSER = 3; // no cookie sharing and individual processes (uses contexts)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2x1c3Rlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9DbHVzdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsK0JBQTZFO0FBQzdFLHVDQUFnQztBQUNoQywrQkFBK0I7QUFDL0IscUNBQThDO0FBRTlDLHVFQUF1RTtBQUd2RSxtQ0FBNEI7QUFDNUIsbURBQTRDO0FBQzVDLG1DQUFzQztBQUl0QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBdUI3QyxNQUFNLGVBQWUsR0FBbUI7SUFDcEMsV0FBVyxFQUFFLENBQUM7SUFDZCxjQUFjLEVBQUUsQ0FBQztJQUNqQixtQkFBbUIsRUFBRSxDQUFDO0lBQ3RCLGdCQUFnQixFQUFFO0lBQ2QsMENBQTBDO0tBQzdDO0lBQ0QsaUJBQWlCLEVBQUUsU0FBUztJQUM1QixPQUFPLEVBQUUsS0FBSztJQUNkLE9BQU8sRUFBRSxFQUFFLEdBQUcsSUFBSTtJQUNsQixVQUFVLEVBQUUsQ0FBQztJQUNiLFVBQVUsRUFBRSxDQUFDO0lBQ2IsaUJBQWlCLEVBQUUsS0FBSztJQUN4QixlQUFlLEVBQUUsQ0FBQztJQUNsQixTQUFTLEVBQUUsU0FBUztDQUN2QixDQUFDO0FBY0YsTUFBTSwyQkFBMkIsR0FBRyxHQUFHLENBQUM7QUFDeEMsTUFBTSx1QkFBdUIsR0FBRyxHQUFHLENBQUM7QUFDcEMsTUFBTSx3QkFBd0IsR0FBRyxFQUFFLENBQUM7QUFFcEMsTUFBcUIsT0FBeUMsU0FBUSxxQkFBWTtJQTRDOUUsWUFBb0IsT0FBK0I7UUFDL0MsS0FBSyxFQUFFLENBQUM7UUF0Q0osc0JBQWlCLEdBQTJCLElBQUksQ0FBQztRQUNqRCxZQUFPLEdBQWtDLEVBQUUsQ0FBQztRQUM1QyxpQkFBWSxHQUFrQyxFQUFFLENBQUM7UUFDakQsZ0JBQVcsR0FBa0MsRUFBRSxDQUFDO1FBQ2hELG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1FBRXBCLG1CQUFjLEdBQUcs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