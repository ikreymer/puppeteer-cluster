"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SingleBrowserImplementation_1 = require("../SingleBrowserImplementation");
class Context extends SingleBrowserImplementation_1.default {
    async createResources() {
        const context = await this.browser
            .createIncognitoBrowserContext();
        const page = await context.newPage();
        return {
            context,
            page,
        };
    }
    async freeResources(resources) {
        await resources.context.close();
    }
}
exports.default = Context;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb25jdXJyZW5jeS9idWlsdC1pbi9Db250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsZ0ZBQXlFO0FBRXpFLE1BQXFCLE9BQVEsU0FBUSxxQ0FBMkI7SUFFbEQsS0FBSyxDQUFDLGVBQWU7UUFDM0IsTUFBTSxPQUFPLEdBQUcsTUFBTyxJQUFJLENBQUMsT0FBNkI7YUFDcEQsNkJBQTZCLEVBQUUsQ0FBQztRQUNyQyxNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQyxPQUFPO1lBQ0gsT0FBTztZQUNQLElBQUk7U0FDUCxDQUFDO0lBQ04sQ0FBQztJQUVTLEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBdUI7UUFDakQsTUFBTSxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BDLENBQUM7Q0FFSjtBQWhCRCwwQkFnQkMifQ==