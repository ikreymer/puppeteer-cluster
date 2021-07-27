"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../util");
const ConcurrencyImplementation_1 = require("../ConcurrencyImplementation");
const debug = util_1.debugGenerator('BrowserConcurrency');
const BROWSER_TIMEOUT = 5000;
class Browser extends ConcurrencyImplementation_1.default {
    async init() { }
    async close() { }
    async workerInstance(perBrowserOptions) {
        const options = perBrowserOptions || this.options;
        let chrome = await this.puppeteer.launch(options);
        let page;
        let context; // puppeteer typings are old...
        return {
            jobInstance: async () => {
                await util_1.timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    context = await chrome.createIncognitoBrowserContext();
                    page = await context.newPage();
                })());
                return {
                    resources: {
                        page,
                    },
                    close: async () => {
                        await util_1.timeoutExecute(BROWSER_TIMEOUT, context.close());
                    },
                };
            },
            close: async () => {
                await chrome.close();
            },
            repair: async () => {
                debug('Starting repair');
                try {
                    // will probably fail, but just in case the repair was not necessary
                    await chrome.close();
                }
                catch (e) { }
                // just relaunch as there is only one page per browser
                chrome = await this.puppeteer.launch(this.options);
            },
        };
    }
}
exports.default = Browser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb25jdXJyZW5jeS9idWlsdC1pbi9Ccm93c2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EscUNBQTREO0FBQzVELDRFQUF5RjtBQUN6RixNQUFNLEtBQUssR0FBRyxxQkFBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFFbkQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBRTdCLE1BQXFCLE9BQVEsU0FBUSxtQ0FBeUI7SUFDbkQsS0FBSyxDQUFDLElBQUksS0FBSSxDQUFDO0lBQ2YsS0FBSyxDQUFDLEtBQUssS0FBSSxDQUFDO0lBRWhCLEtBQUssQ0FBQyxjQUFjLENBQUMsaUJBQXNEO1FBRzlFLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDbEQsSUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQXNCLENBQUM7UUFDdkUsSUFBSSxJQUFvQixDQUFDO1FBQ3pCLElBQUksT0FBWSxDQUFDLENBQUMsK0JBQStCO1FBRWpELE9BQU87WUFDSCxXQUFXLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3BCLE1BQU0scUJBQWMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFDOUMsT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLDZCQUE2QixFQUFFLENBQUM7b0JBQ3ZELElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUVOLE9BQU87b0JBQ0gsU0FBUyxFQUFFO3dCQUNQLElBQUk7cUJBQ1A7b0JBRUQsS0FBSyxFQUFFLEtBQUssSUFBSSxFQUFFO3dCQUNkLE1BQU0scUJBQWMsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQzNELENBQUM7aUJBQ0osQ0FBQztZQUNOLENBQUM7WUFFRCxLQUFLLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ2QsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDekIsQ0FBQztZQUVELE1BQU0sRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDZixLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDekIsSUFBSTtvQkFDQSxvRUFBb0U7b0JBQ3BFLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2lCQUN4QjtnQkFBQyxPQUFPLENBQUMsRUFBRSxHQUFFO2dCQUVkLHNEQUFzRDtnQkFDdEQsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELENBQUM7U0FDSixDQUFDO0lBQ04sQ0FBQztDQUVKO0FBL0NELDBCQStDQyJ9