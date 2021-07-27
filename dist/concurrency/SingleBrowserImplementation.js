"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConcurrencyImplementation_1 = require("./ConcurrencyImplementation");
const util_1 = require("../util");
const debug = util_1.debugGenerator('SingleBrowserImpl');
const BROWSER_TIMEOUT = 5000;
class SingleBrowserImplementation extends ConcurrencyImplementation_1.default {
    constructor(options, puppeteer) {
        super(options, puppeteer);
        this.browser = null;
        this.repairing = false;
        this.repairRequested = false;
        this.openInstances = 0;
        this.waitingForRepairResolvers = [];
    }
    async repair() {
        if (this.openInstances !== 0 || this.repairing) {
            // already repairing or there are still pages open? wait for start/finish
            await new Promise(resolve => this.waitingForRepairResolvers.push(resolve));
            return;
        }
        this.repairing = true;
        debug('Starting repair');
        try {
            // will probably fail, but just in case the repair was not necessary
            await this.browser.close();
        }
        catch (e) {
            debug('Unable to close browser.');
        }
        try {
            this.browser = await this.puppeteer.launch(this.options);
        }
        catch (err) {
            throw new Error('Unable to restart chrome.');
        }
        this.repairRequested = false;
        this.repairing = false;
        this.waitingForRepairResolvers.forEach(resolve => resolve());
        this.waitingForRepairResolvers = [];
    }
    async init() {
        this.browser = await this.puppeteer.launch(this.options);
    }
    async close() {
        await this.browser.close();
    }
    async workerInstance() {
        let resources;
        return {
            jobInstance: async () => {
                if (this.repairRequested) {
                    await this.repair();
                }
                await util_1.timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    resources = await this.createResources();
                })());
                this.openInstances += 1;
                return {
                    resources,
                    close: async () => {
                        this.openInstances -= 1; // decrement first in case of error
                        await util_1.timeoutExecute(BROWSER_TIMEOUT, this.freeResources(resources));
                        if (this.repairRequested) {
                            await this.repair();
                        }
                    },
                };
            },
            close: async () => { },
            repair: async () => {
                debug('Repair requested');
                this.repairRequested = true;
                await this.repair();
            },
        };
    }
}
exports.default = SingleBrowserImplementation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2luZ2xlQnJvd3NlckltcGxlbWVudGF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbmN1cnJlbmN5L1NpbmdsZUJyb3dzZXJJbXBsZW1lbnRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLDJFQUFzRjtBQUV0RixrQ0FBeUQ7QUFDekQsTUFBTSxLQUFLLEdBQUcscUJBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBRWxELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQztBQUU3QixNQUE4QiwyQkFBNEIsU0FBUSxtQ0FBeUI7SUFTdkYsWUFBbUIsT0FBZ0MsRUFBRSxTQUFjO1FBQy9ELEtBQUssQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFScEIsWUFBTyxHQUE2QixJQUFJLENBQUM7UUFFM0MsY0FBUyxHQUFZLEtBQUssQ0FBQztRQUMzQixvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUNqQyxrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQiw4QkFBeUIsR0FBbUIsRUFBRSxDQUFDO0lBSXZELENBQUM7SUFFTyxLQUFLLENBQUMsTUFBTTtRQUNoQixJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDNUMseUVBQXlFO1lBQ3pFLE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDM0UsT0FBTztTQUNWO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFFekIsSUFBSTtZQUNBLG9FQUFvRTtZQUNwRSxNQUEwQixJQUFJLENBQUMsT0FBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ25EO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDUixLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztTQUNyQztRQUVELElBQUk7WUFDQSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBc0IsQ0FBQztTQUNqRjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1NBQ2hEO1FBQ0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRU0sS0FBSyxDQUFDLElBQUk7UUFDYixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSztRQUNkLE1BQU8sSUFBSSxDQUFDLE9BQTZCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEQsQ0FBQztJQU1NLEtBQUssQ0FBQyxjQUFjO1FBQ3ZCLElBQUksU0FBdUIsQ0FBQztRQUU1QixPQUFPO1lBQ0gsV0FBVyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNwQixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3RCLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUN2QjtnQkFFRCxNQUFNLHFCQUFjLENBQUMsZUFBZSxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUU7b0JBQzlDLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDN0MsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNOLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDO2dCQUV4QixPQUFPO29CQUNILFNBQVM7b0JBRVQsS0FBSyxFQUFFLEtBQUssSUFBSSxFQUFFO3dCQUNkLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLENBQUMsbUNBQW1DO3dCQUM1RCxNQUFNLHFCQUFjLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFFckUsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFOzRCQUN0QixNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt5QkFDdkI7b0JBQ0wsQ0FBQztpQkFDSixDQUFDO1lBQ04sQ0FBQztZQUVELEtBQUssRUFBRSxLQUFLLElBQUksRUFBRSxHQUFFLENBQUM7WUFFckIsTUFBTSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNmLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDNUIsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDeEIsQ0FBQztTQUNKLENBQUM7SUFDTixDQUFDO0NBQ0o7QUExRkQsOENBMEZDIn0=