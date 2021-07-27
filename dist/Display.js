"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CLEAR_LINE = '\x1B[K';
class Display {
    constructor() {
        this.lastLinesCount = 0;
        this.linesCount = 0;
    }
    async log(str) {
        // We create an empty line at the start so that any console.log calls
        // from within the script are above our output.
        if (this.linesCount === 0) {
            console.log(CLEAR_LINE); // erases the current line
            this.linesCount += 1;
        }
        // Strip lines that are too long
        const strToLog = str.substr(0, 78);
        console.log(`${CLEAR_LINE}${strToLog}`);
        this.linesCount += 1;
    }
    async resetCursor() {
        // move cursor up to draw over out output
        process.stdout.write(`\x1B[${this.linesCount}A`);
        this.lastLinesCount = this.linesCount;
        this.linesCount = 0;
    }
    close() {
        // move cursor down so that console output stays
        process.stdout.write(`\x1B[${this.lastLinesCount}B`);
    }
}
exports.default = Display;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzcGxheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9EaXNwbGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDO0FBRTVCLE1BQXFCLE9BQU87SUFBNUI7UUFFWSxtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUMzQixlQUFVLEdBQVcsQ0FBQyxDQUFDO0lBNEJuQyxDQUFDO0lBMUJVLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBVztRQUN4QixxRUFBcUU7UUFDckUsK0NBQStDO1FBQy9DLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVBQUU7WUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtZQUNuRCxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQztTQUN4QjtRQUVELGdDQUFnQztRQUNoQyxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxHQUFHLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVNLEtBQUssQ0FBQyxXQUFXO1FBQ3BCLHlDQUF5QztRQUN6QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN0QyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRU0sS0FBSztRQUNSLGdEQUFnRDtRQUNoRCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FFSjtBQS9CRCwwQkErQkMifQ==