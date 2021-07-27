"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const util_2 = require("util");
const debug = util_1.debugGenerator('Worker');
const DEFAULT_OPTIONS = {
    args: [],
};
const BROWSER_INSTANCE_TRIES = 10;
class Worker {
    constructor({ cluster, args, id, browser }) {
        this.activeTarget = null;
        this.cluster = cluster;
        this.args = args;
        this.id = id;
        this.browser = browser;
        debug(`Starting #${this.id}`);
    }
    async handle(task, job, timeout) {
        this.activeTarget = job;
        let jobInstance = null;
        let page = null;
        let tries = 0;
        while (jobInstance === null) {
            try {
                jobInstance = await this.browser.jobInstance();
                page = jobInstance.resources.page;
            }
            catch (err) {
                debug(`Error getting browser page (try: ${tries}), message: ${err.message}`);
                await this.browser.repair();
                tries += 1;
                if (tries >= BROWSER_INSTANCE_TRIES) {
                    throw new Error('Unable to get browser page');
                }
            }
        }
        // We can be sure that page is set now, otherwise an exception would've been thrown
        page = page; // this is just for TypeScript
        let errorState = null;
        page.on('error', (err) => {
            errorState = err;
            util_1.log(`Error (page error) crawling ${util_2.inspect(job.data)} // message: ${err.message}`);
        });
        debug(`Executing task on worker #${this.id} with data: ${util_2.inspect(job.data)}`);
        let result;
        try {
            result = await util_1.timeoutExecute(timeout, task({
                page,
                // data might be undefined if queue is only called with a function
                // we ignore that case, as the user should use Cluster<undefined> in that case
                // to get correct typings
                data: job.data,
                worker: {
                    id: this.id,
                },
            }));
        }
        catch (err) {
            errorState = err;
            util_1.log(`Error crawling ${util_2.inspect(job.data)} // message: ${err.message}`);
        }
        debug(`Finished executing task on worker #${this.id}`);
        try {
            await jobInstance.close();
        }
        catch (e) {
            debug(`Error closing browser instance for ${util_2.inspect(job.data)}: ${e.message}`);
            await this.browser.repair();
        }
        this.activeTarget = null;
        if (errorState) {
            return {
                type: 'error',
                error: errorState || new Error('asf'),
            };
        }
        return {
            data: result,
            type: 'success',
        };
    }
    async close() {
        try {
            await this.browser.close();
        }
        catch (err) {
            debug(`Unable to close worker browser. Error message: ${err.message}`);
        }
        debug(`Closed #${this.id}`);
    }
}
exports.default = Worker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1dvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUlBLGlDQUE2RDtBQUM3RCwrQkFBK0I7QUFHL0IsTUFBTSxLQUFLLEdBQUcscUJBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUV2QyxNQUFNLGVBQWUsR0FBRztJQUNwQixJQUFJLEVBQUUsRUFBRTtDQUNYLENBQUM7QUFTRixNQUFNLHNCQUFzQixHQUFHLEVBQUUsQ0FBQztBQWNsQyxNQUFxQixNQUFNO0lBU3ZCLFlBQW1CLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFpQjtRQUZoRSxpQkFBWSxHQUFvQyxJQUFJLENBQUM7UUFHakQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUV2QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sS0FBSyxDQUFDLE1BQU0sQ0FDWCxJQUF1QyxFQUN2QyxHQUE2QixFQUM3QixPQUFlO1FBRW5CLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1FBRXhCLElBQUksV0FBVyxHQUF1QixJQUFJLENBQUM7UUFDM0MsSUFBSSxJQUFJLEdBQWdCLElBQUksQ0FBQztRQUU3QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFFZCxPQUFPLFdBQVcsS0FBSyxJQUFJLEVBQUU7WUFDekIsSUFBSTtnQkFDQSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7YUFD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