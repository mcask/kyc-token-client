export declare class NodeResolver {
    private nodeAddress;
    readonly chain: string;
    private index;
    constructor(nodeAddress: string[], chain: string);
    getAddress(): string;
}
