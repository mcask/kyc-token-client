"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeResolver = void 0;
class NodeResolver {
    constructor(nodeAddress, chain) {
        this.nodeAddress = nodeAddress;
        this.chain = chain;
        this.index = 0;
    }
    getAddress() {
        const i = this.index;
        this.index += 1;
        if (this.index >= this.nodeAddress.length) {
            this.index = 0;
        }
        return this.nodeAddress[this.index];
    }
}
exports.NodeResolver = NodeResolver;
//# sourceMappingURL=node-resolver.js.map