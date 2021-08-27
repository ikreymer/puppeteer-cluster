"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Queue {
    constructor() {
        this.list = [];
        this.delayedItems = 0;
        this.count = 0;
    }
    async size() {
        return this.list.length + this.delayedItems;
    }
    async push(item, options = {}) {
        if (options && options.delayUntil && options.delayUntil > Date.now()) {
            this.delayedItems += 1;
            setTimeout(() => {
                this.delayedItems -= 1;
                this.list.push(item);
            }, (options.delayUntil - Date.now()));
        }
        else {
            this.list.push(item);
            this.count++;
        }
    }
    // Care, this function might actually return undefined even though size() returns a value > 0
    // Reason is, that there might be delayedItems (checkout QueueOptions.delayUntil)
    async shift() {
        return this.list.shift();
    }
    async numSeen() {
        return this.count;
    }
    async numPending(numLocalBusy) {
        return numLocalBusy;
    }
}
exports.default = Queue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUXVldWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSxNQUFxQixLQUFLO0lBQTFCO1FBRVksU0FBSSxHQUFRLEVBQUUsQ0FBQztRQUNmLGlCQUFZLEdBQVcsQ0FBQyxDQUFDO1FBQ3pCLFVBQUssR0FBVyxDQUFDLENBQUM7SUFxQzlCLENBQUM7SUFuQ1UsS0FBSyxDQUFDLElBQUk7UUFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDaEQsQ0FBQztJQUVNLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBTyxFQUFFLFVBQXdCLEVBQUU7UUFDakQsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsSUFBSSxPQUFPLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsRSxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQztZQUN2QixVQUFVLENBQ04sR0FBRyxFQUFFO2dCQUNELElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDO2dCQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QixDQUFDLEVBQ0QsQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUNwQyxDQUFDO1NBQ0w7YUFBTTtZQUNILElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNoQjtJQUNMLENBQUM7SUFFRCw2RkFBNkY7SUFDN0YsaUZBQWlGO0lBQzFFLEtBQUssQ0FBQyxLQUFLO1FBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFHTSxLQUFLLENBQUMsT0FBTztRQUNoQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDdEIsQ0FBQztJQUVNLEtBQUssQ0FBQyxVQUFVLENBQUMsWUFBb0I7UUFDeEMsT0FBTyxZQUFZLENBQUM7SUFDeEIsQ0FBQztDQUVKO0FBekNELHdCQXlDQyJ9