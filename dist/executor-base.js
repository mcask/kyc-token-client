"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasperExecutor = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
class CasperExecutor {
    constructor(resolver) {
        this.resolver = resolver;
    }
    async getPublicKey() {
        throw Error('Not implemented!');
    }
    /**
     * Execute a contract call that requires a signature
     * @param params
     */
    async call(params) {
        throw Error('Not implemented!');
    }
    /**
     * Install a given contract
     * @param params
     */
    async install(params) {
        throw Error('Not implemented!');
    }
    /**
     * Get result of a deploy
     * @param deployHash
     */
    async getDeploy(deployHash) {
        const client = new casper_js_sdk_1.CasperClient(this.resolver.getAddress());
        return await client.getDeploy(deployHash);
    }
    /**
     * Get the contract data for the given path, default everything
     * @param contractHash
     * @param path
     */
    async getContractData(contractHash, path = []) {
        const client = new casper_js_sdk_1.CasperServiceByJsonRPC(this.resolver.getAddress());
        const stateRootHash = await this.getStateRootHash(client);
        return await client.getBlockState(stateRootHash, `hash-${contractHash}`, path);
    }
    /**
     * Get the specific key from the given contract
     * @param contractHash
     * @param keys
     */
    async getContractKey(contractHash, keys) {
        const clValue = await this.getContractData(contractHash, keys);
        if (clValue && clValue.CLValue instanceof casper_js_sdk_1.CLValue) {
            return new Promise((r) => r(clValue.CLValue));
        }
        throw Error("Invalid stored value");
    }
    /**
     *
     * @param dictionaryItemKey
     * @param seedUref
     */
    async getContractDictionaryKey(dictionaryItemKey, seedUref) {
        const client = new casper_js_sdk_1.CasperServiceByJsonRPC(this.resolver.getAddress());
        const stateRootHash = await this.getStateRootHash(client);
        const storedValue = await client.getDictionaryItemByURef(stateRootHash, dictionaryItemKey, seedUref);
        if (storedValue && storedValue.CLValue instanceof casper_js_sdk_1.CLValue) {
            return new Promise((r) => r(storedValue.CLValue));
        }
        throw Error("Invalid stored value");
    }
    async getStateRootHash(client) {
        const { block } = await client.getLatestBlockInfo();
        if (block) {
            return new Promise((r) => r(block.header.state_root_hash));
        }
        else {
            throw Error("Problem when calling getLatestBlockInfo");
        }
    }
}
exports.CasperExecutor = CasperExecutor;
//# sourceMappingURL=executor-base.js.map