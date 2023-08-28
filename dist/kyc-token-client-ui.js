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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycTokenUIClient = void 0;
const bytes_1 = require("@ethersproject/bytes");
const blake2b_1 = require("@noble/hashes/blake2b");
const casper_js_sdk_1 = require("casper-js-sdk");
const gateway_token_1 = require("./gateway-token");
const utils = __importStar(require("./utils"));
const utils_1 = require("./utils");
class KycTokenUIClient {
    /**
     * Construct the KYC Token Client
     * @param nodeAddress
     * @param chainName
     */
    constructor(nodeAddress, chainName) {
        this.nodeAddress = nodeAddress;
        this.chainName = chainName;
    }
    async setContractHash(hash) {
        const stateRootHash = await utils.getStateRootHash(this.nodeAddress);
        const contractData = await utils.getContractData(this.nodeAddress, stateRootHash, hash);
        const { contractPackageHash, namedKeys } = contractData.Contract;
        this.contractHash = hash;
        this.contractPackageHash = contractPackageHash.replace("contract-package-wasm", "");
        const LIST_OF_NAMED_KEYS = [
            "admins",
            "allowances",
            "balances",
            "gatekeepers",
            "metadata",
            "owned_indexes_by_token",
            "owned_tokens_by_index",
            "owners",
            "issuers",
            "paused",
        ];
        // @ts-ignore
        this.namedKeys = namedKeys.reduce((acc, val) => {
            if (LIST_OF_NAMED_KEYS.includes(val.name)) {
                return Object.assign(Object.assign({}, acc), { [utils.camelCased(val.name)]: val.key });
            }
            return acc;
        }, {});
    }
    async name() {
        const result = await utils_1.contractSimpleGetter(this.nodeAddress, this.contractHash, ["name"]);
        return result.value();
    }
    async symbol() {
        const result = await utils_1.contractSimpleGetter(this.nodeAddress, this.contractHash, ["symbol"]);
        return result.value();
    }
    async meta() {
        const result = await utils_1.contractSimpleGetter(this.nodeAddress, this.contractHash, ["meta"]);
        const res = result.value();
        const jsMap = new Map();
        for (const [innerKey, value] of res) {
            jsMap.set(innerKey.value(), value.value());
        }
        return jsMap;
    }
    async balanceOf(account) {
        const accountHash = Buffer.from(account.toAccountHash()).toString("hex");
        const result = await utils.contractDictionaryGetter(this.nodeAddress, accountHash, this.namedKeys.balances);
        const maybeValue = result === null || result === void 0 ? void 0 : result.value().unwrap();
        return maybeValue.value().toString();
    }
    async getOwnerOf(tokenId) {
        const result = await utils.contractDictionaryGetter(this.nodeAddress, tokenId, this.namedKeys.owners);
        const maybeValue = result.value().unwrap();
        return `account-hash-${Buffer.from(maybeValue.value().value()).toString("hex")}`;
    }
    async getIssuerOf(tokenId) {
        const result = await utils.contractDictionaryGetter(this.nodeAddress, tokenId, this.namedKeys.issuers);
        const maybeValue = result.value().unwrap();
        return `account-hash-${Buffer.from(maybeValue.value().value()).toString("hex")}`;
    }
    async totalSupply() {
        const result = await utils_1.contractSimpleGetter(this.nodeAddress, this.contractHash, ["total_supply"]);
        return result.value();
    }
    /**
     * Return the KYC Token associated with the given account
     * @param account
     */
    async getGatewayToken(account) {
        const kycToken = await this.getKYCToken(account);
        if (!kycToken) {
            return new Promise((resolve) => resolve(undefined));
        }
        const result = await utils.contractDictionaryGetter(this.nodeAddress, kycToken, this.namedKeys.metadata);
        const maybeValue = result.value().unwrap();
        const map = maybeValue.value();
        const jsMap = new Map();
        for (const [innerKey, value] of map) {
            jsMap.set(innerKey.value(), value.value());
        }
        return new Promise((resolve) => resolve(gateway_token_1.GatewayToken.of(account, kycToken, jsMap)));
    }
    /**
     * Test if the KYC Token contract is paused
     */
    // TODO: Error: state query failed: ValueNotFound
    async isPaused() {
        const result = await utils_1.contractSimpleGetter(this.nodeAddress, this.contractHash, ["is_paused"]);
        return result.value();
    }
    /**
     * Confirm that the given hash has been deployed, poll this till either an exception is thrown indicating error
     * or a valid deployment result is returned
     * @param deployHash
     */
    async confirmDeploy(deployHash) {
        const client = new casper_js_sdk_1.CasperClient(this.nodeAddress);
        const [deploy, raw] = await client.getDeploy(deployHash);
        if (raw.execution_results.length !== 0) {
            // @ts-ignore
            if (raw.execution_results[0].result.Success) {
                return new Promise((resolve) => resolve(deploy));
            }
            else {
                // @ts-ignore
                throw Error("Contract execution: " + raw.execution_results[0].result.Failure.error_message);
            }
        }
        return new Promise((resolve) => resolve(undefined));
    }
    async getKYCToken(account) {
        const accountKey = utils.createRecipientAddress(account);
        const accountBytes = casper_js_sdk_1.CLValueParsers.toBytes(accountKey).unwrap();
        const balanceOri = await this.balanceOf(account);
        const balance = parseInt(balanceOri, 10);
        if (balance !== 0) {
            const numBytes = casper_js_sdk_1.CLValueParsers.toBytes(casper_js_sdk_1.CLValueBuilder.u256(0)).unwrap();
            const concated = bytes_1.concat([accountBytes, numBytes]);
            // const blaked = blake.blake2b(concated, undefined, 32)
            const blaked = blake2b_1.blake2b(concated, {
                dkLen: 32
            });
            const str = Buffer.from(blaked).toString("hex");
            const result = await utils.contractDictionaryGetter(this.nodeAddress, str, this.namedKeys.ownedTokensByIndex);
            const maybeValue = result.value().unwrap();
            return new Promise((resolve) => resolve(maybeValue.value()));
        }
        return new Promise((resolve) => resolve(undefined));
    }
}
exports.KycTokenUIClient = KycTokenUIClient;
//# sourceMappingURL=kyc-token-client-ui.js.map