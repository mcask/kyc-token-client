"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalCasperExecutor = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
const executor_base_1 = require("./executor-base");
const utils = __importStar(require("./utils"));
class LocalCasperExecutor extends executor_base_1.CasperExecutor {
    constructor(resolver, key) {
        super(resolver);
        this.key = key;
    }
    async getPublicKey() {
        return new Promise(r => r(this.key.publicKey));
    }
    /**
     * Execute a contract call
     * @param params
     */
    async call(params) {
        const client = new casper_js_sdk_1.CasperClient(this.resolver.getAddress());
        const contractHashAsByteArray = utils.contractHashToByteArray(params.contractHash);
        let deploy = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(this.key.publicKey, this.resolver.chain, 1, params.ttl), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newStoredContractByHash(contractHashAsByteArray, params.entryPoint, params.runtimeArgs), casper_js_sdk_1.DeployUtil.standardPayment(params.paymentAmount));
        // Sign deploy.
        deploy = client.signDeploy(deploy, this.key);
        // Dispatch deploy to node.
        return await client.putDeploy(deploy);
    }
    /**
     * Install the given contract
     * @param params
     */
    async install(params) {
        const client = new casper_js_sdk_1.CasperClient(this.resolver.getAddress());
        // Set contract installation deploy (unsigned).
        let deploy = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(casper_js_sdk_1.CLPublicKey.fromHex(this.key.publicKey.toHex()), this.resolver.chain), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newModuleBytes(utils.getBinary(params.pathToContract), params.runtimeArgs), casper_js_sdk_1.DeployUtil.standardPayment(params.paymentAmount));
        // Sign deploy.
        deploy = client.signDeploy(deploy, this.key);
        // Dispatch deploy to node.
        return await client.putDeploy(deploy);
    }
}
exports.LocalCasperExecutor = LocalCasperExecutor;
//# sourceMappingURL=local-casper-executor.js.map