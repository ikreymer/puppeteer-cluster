interface QueueOptions {
    delayUntil?: number;
}
export default class Queue<T> {
    private list;
    private delayedItems;
    size(): Promise<number>;
    push(item: T, options?: QueueOptions): Promise<void>;
    shift(): Promise<T | undefined>;
}
export {};
