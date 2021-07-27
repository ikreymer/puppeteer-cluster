"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SingleBrowserImplementation_1 = require("../SingleBrowserImplementation");
class Page extends SingleBrowserImplementation_1.default {
    async createResources() {
        return {
            page: await this.browser.newPage(),
        };
    }
    async freeResources(resources) {
        await resources.page.close();
    }
}
exports.default = Page;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb25jdXJyZW5jeS9idWlsdC1pbi9QYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsZ0ZBQXlFO0FBRXpFLE1BQXFCLElBQUssU0FBUSxxQ0FBMkI7SUFFL0MsS0FBSyxDQUFDLGVBQWU7UUFDM0IsT0FBTztZQUNILElBQUksRUFBRSxNQUFPLElBQUksQ0FBQyxPQUE2QixDQUFDLE9BQU8sRUFBRTtTQUM1RCxDQUFDO0lBQ04sQ0FBQztJQUVTLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBdUI7UUFDakQsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pDLENBQUM7Q0FFSjtBQVpELHVCQVlDIn0=