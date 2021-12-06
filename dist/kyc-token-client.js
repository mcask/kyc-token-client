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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycTokenClient = void 0;
const bytes_1 = require("@ethersproject/bytes");
const blakejs_1 = __importDefault(require("blakejs"));
const casper_js_sdk_1 = require("casper-js-sdk");
const ts_results_1 = require("ts-results");
const constants_1 = require("./constants");
const gateway_token_1 = require("./gateway-token");
const utils = __importStar(require("./utils"));
class KycTokenClient {
    /**
     * Construct the KYC Token Client
     * @param executor this does the work on the blockchain
     */
    constructor(executor) {
        this.executor = executor;
    }
    /**
     * Set the hash for this contract
     * @param hash
     */
    async setContractHash(hash) {
        const contractData = await this.executor.getContractData(hash);
        const { contractPackageHash, namedKeys } = contractData.Contract;
        this.contractHash = hash;
        this.contractPackageHash = contractPackageHash.replace("contract-package-wasm", "");
        const LIST_OF_NAMED_KEYS = [
            "admins",
            "allowances",
            "balances",
            "metadata",
            "owned_indexes_by_token",
            "owned_tokens_by_index",
            "owners",
            "issuers",
            "paused"
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
        const result = await this.executor.getContractKey(this.contractHash, ["name"]);
        return result.value();
    }
    async symbol() {
        const result = await this.executor.getContractKey(this.contractHash, ["symbol"]);
        return result.value();
    }
    async meta() {
        const result = await this.executor.getContractKey(this.contractHash, ["meta"]);
        const res = result.value();
        const jsMap = new Map();
        for (const [innerKey, value] of res) {
            jsMap.set(innerKey.value(), value.value());
        }
        return jsMap;
    }
    async balanceOf(account) {
        const accountHash = Buffer.from(account.toAccountHash()).toString("hex");
        try {
            const result = await this.executor.getContractDictionaryKey(accountHash, this.namedKeys.balances);
            const maybeValue = result === null || result === void 0 ? void 0 : result.value().unwrap();
            return maybeValue.value().toString();
        }
        catch (e) {
            return "0"; // exception is thrown when this contract is not present in the account
        }
    }
    async getOwnerOf(tokenId) {
        const result = await this.executor.getContractDictionaryKey(tokenId, this.namedKeys.owners);
        const maybeValue = result.value().unwrap();
        return `account-hash-${Buffer.from(maybeValue.value().value()).toString("hex")}`;
    }
    async getIssuerOf(tokenId) {
        const result = await this.executor.getContractDictionaryKey(tokenId, this.namedKeys.issuers);
        const maybeValue = result.value().unwrap();
        return `account-hash-${Buffer.from(maybeValue.value().value()).toString("hex")}`;
    }
    async totalSupply() {
        const result = await this.executor.getContractKey(this.contractHash, ["total_supply"]);
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
        const result = await this.executor.getContractDictionaryKey(kycToken, this.namedKeys.metadata);
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
        const result = await this.executor.getContractKey(this.contractHash, ["is_paused"]);
        return result.value();
    }
    /**
     * This is a contract level function, where we request a new admin to be whitelisted
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    async addAdmin(account, paymentAmount = constants_1.WHITELIST_PAYMENT_AMOUNT, ttl = constants_1.DEFAULT_TTL) {
        // New minter to add
        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
            admin: utils.createRecipientAddress(account),
        });
        return this.executor.call({
            contractHash: this.contractHash,
            entryPoint: "grant_admin",
            paymentAmount,
            runtimeArgs,
            ttl,
        });
    }
    /**
     * This is a contract level function, where we request an admin to be removed
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    async revokeAdmin(account, paymentAmount = constants_1.WHITELIST_PAYMENT_AMOUNT, ttl = constants_1.DEFAULT_TTL) {
        // New minter to add
        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
            admin: utils.createRecipientAddress(account),
        });
        return this.executor.call({
            contractHash: this.contractHash,
            entryPoint: "revoke_admin",
            paymentAmount,
            runtimeArgs,
            ttl,
        });
    }
    /**
     * This is a contract level function, where we request a new gatekeeper to be whitelisted
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    async addGatekeeper(account, paymentAmount = constants_1.WHITELIST_PAYMENT_AMOUNT, ttl = constants_1.DEFAULT_TTL) {
        // New minter to add
        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
            gatekeeper: utils.createRecipientAddress(account),
        });
        return this.executor.call({
            contractHash: this.contractHash,
            entryPoint: "grant_gatekeeper",
            paymentAmount,
            runtimeArgs,
            ttl,
        });
    }
    /**
     * This is a contract level function, where we request a gatekeeper to be removed
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    async revokeGatekeeper(account, paymentAmount = constants_1.WHITELIST_PAYMENT_AMOUNT, ttl = constants_1.DEFAULT_TTL) {
        // New minter to add
        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
            gatekeeper: utils.createRecipientAddress(account),
        });
        return this.executor.call({
            contractHash: this.contractHash,
            entryPoint: "revoke_gatekeeper",
            paymentAmount,
            runtimeArgs,
            ttl,
        });
    }
    /**
     * Issue a KYC Token to the given account
     * @param account
     * @param token
     * @param paymentAmount
     * @param ttl
     */
    async issue(token, paymentAmount = constants_1.MINT_PAYMENT_AMOUNT, ttl = constants_1.DEFAULT_TTL) {
        // By default no token id here!
        const tokenId = casper_js_sdk_1.CLValueBuilder.option(ts_results_1.None, casper_js_sdk_1.CLTypeBuilder.string());
        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
            recipient: utils.createRecipientAddress(token.account),
            token_id: tokenId,
            token_meta: token.toClMap(),
        });
        return this.executor.call({
            contractHash: this.contractHash,
            entryPoint: "mint",
            paymentAmount,
            runtimeArgs,
            ttl,
        });
    }
    /**
     * Update the state of the KYC Token in the given account
     * @param account
     * @param state
     * @param paymentAmount
     */
    async updateState(account, state, paymentAmount) {
        const kycToken = await this.getGatewayToken(account);
        if (!kycToken) {
            throw Error(`KYC Token not found for account: ${account.toHex()}`);
        }
        return this.updateTokenMetadata(kycToken, casper_js_sdk_1.CLValueBuilder.string("status"), casper_js_sdk_1.CLValueBuilder.string(state), paymentAmount);
    }
    /**
     * Revoke the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    async revoke(account, paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT) {
        return this.updateState(account, gateway_token_1.State.REVOKED, paymentAmount);
    }
    /**
     * Freeze the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    async freeze(account, paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT) {
        return this.updateState(account, gateway_token_1.State.FROZEN, paymentAmount);
    }
    /**
     * Unfreeze the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    async unfreeze(account, paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT) {
        return this.updateState(account, gateway_token_1.State.ACTIVE, paymentAmount);
    }
    /**
     * Update the expiry of the KYC Token belonging to this account
     * @param account
     * @param expireTime
     * @param paymentAmount
     */
    async updateExpiry(account, expireTime, paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT) {
        const kycToken = await this.getGatewayToken(account);
        if (!kycToken) {
            throw Error(`KYC Token not found for account: ${account.toHex()}`);
        }
        // Check what we need to do here
        if (expireTime) {
            return this.updateTokenMetadata(kycToken, casper_js_sdk_1.CLValueBuilder.string("expiry"), casper_js_sdk_1.CLValueBuilder.string(expireTime), paymentAmount);
        }
        // Expiry time removed, so reset the state completely
        return this.setTokenMetadata(kycToken.withExpiry(expireTime), paymentAmount);
    }
    /**
     * Confirm that the given hash has been deployed, poll this till either an exception is thrown indicating error
     * or a valid deployment result is returned
     * @param deployHash
     */
    async confirmDeploy(deployHash) {
        const [deploy, raw] = await this.executor.getDeploy(deployHash);
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
            const blaked = blakejs_1.default.blake2b(concated, undefined, 32);
            const str = Buffer.from(blaked).toString("hex");
            const result = await this.executor.getContractDictionaryKey(str, this.namedKeys.ownedTokensByIndex);
            const maybeValue = result.value().unwrap();
            return new Promise((resolve) => resolve(maybeValue.value()));
        }
        return new Promise((resolve) => resolve(undefined));
    }
    /**
     * The set function updates the entire metadata object
     * @param token
     * @param paymentAmount
     * @param ttl
     */
    async setTokenMetadata(token, paymentAmount, ttl = constants_1.DEFAULT_TTL) {
        if (!token.tokenId) {
            throw Error("Cannot set KYC Token Metadata with no id!");
        }
        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
            token_id: casper_js_sdk_1.CLValueBuilder.string(token.tokenId),
            token_meta: token.toClMap(),
        });
        return this.executor.call({
            contractHash: this.contractHash,
            entryPoint: "set_token_meta",
            paymentAmount,
            runtimeArgs,
            ttl,
        });
    }
    /**
     * The update fundtion only needs the metadata that needs to change per Casper
     * @param token
     * @param metaKey
     * @param metaValue
     * @param paymentAmount
     * @param ttl
     */
    async updateTokenMetadata(token, metaKey, metaValue, paymentAmount, ttl = constants_1.DEFAULT_TTL) {
        if (!token.tokenId) {
            throw Error("Cannot update KYC Token Metadata with no id!");
        }
        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
            token_id: casper_js_sdk_1.CLValueBuilder.string(token.tokenId),
            token_meta_key: metaKey,
            token_meta_value: metaValue
        });
        return this.executor.call({
            contractHash: this.contractHash,
            entryPoint: "update_token_meta",
            paymentAmount,
            runtimeArgs,
            ttl,
        });
    }
}
exports.KycTokenClient = KycTokenClient;
//# sourceMappingURL=kyc-token-client.js.map