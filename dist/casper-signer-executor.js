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
exports.CasperSignerExecutor = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
const executor_base_1 = require("./executor-base");
const utils = __importStar(require("./utils"));
class CasperSignerExecutor extends executor_base_1.CasperExecutor {
    constructor(resolver) {
        super(resolver);
    }
    async getPublicKey() {
        const key = await casper_js_sdk_1.Signer.getActivePublicKey();
        return new Promise(r => r(casper_js_sdk_1.CLPublicKey.fromHex(key)));
    }
    /**
     * Execute a contract call
     * @param params
     */
    async call(params) {
        const client = new casper_js_sdk_1.CasperClient(this.resolver.getAddress());
        const contractHashAsByteArray = utils.contractHashToByteArray(params.contractHash);
        const publicKey = await casper_js_sdk_1.Signer.getActivePublicKey();
        const deployData = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(casper_js_sdk_1.CLPublicKey.fromHex(publicKey), this.resolver.chain, 1, params.ttl), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newStoredContractByHash(contractHashAsByteArray, params.entryPoint, params.runtimeArgs), casper_js_sdk_1.DeployUtil.standardPayment(params.paymentAmount));
        // Sign deploy.
        const target = params.recipient ? params.recipient : publicKey;
        const deploy = await casper_js_sdk_1.Signer.sign(client.deployToJson(deployData), publicKey, target);
        const signedDeploy = client.deployFromJson(deploy);
        if (signedDeploy.ok) {
            return await client.putDeploy(signedDeploy.unwrap());
        }
        throw Error("Failed to sign the contract call!");
    }
    /**
     * Install the given contract
     * @param params
     */
    async install(params) {
        const client = new casper_js_sdk_1.CasperClient(this.resolver.getAddress());
        const publicKey = await casper_js_sdk_1.Signer.getActivePublicKey();
        // Set contract installation deploy (unsigned).
        const deployData = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(casper_js_sdk_1.CLPublicKey.fromHex(publicKey), this.resolver.chain), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newModuleBytes(utils.getBinary(params.pathToContract), params.runtimeArgs), casper_js_sdk_1.DeployUtil.standardPayment(params.paymentAmount));
        // Sign deploy.
        const deploy = await casper_js_sdk_1.Signer.sign(client.deployToJson(deployData), publicKey, publicKey);
        const signedDeploy = client.deployFromJson(deploy);
        if (signedDeploy.ok) {
            return await client.putDeploy(signedDeploy.unwrap());
        }
        throw Error("Failed to sign the contract call!");
    }
}
exports.CasperSignerExecutor = CasperSignerExecutor;
//# sourceMappingURL=casper-signer-executor.js.map