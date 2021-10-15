"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycTokenClient = void 0;
var bytes_1 = require("@ethersproject/bytes");
var blakejs_1 = __importDefault(require("blakejs"));
var casper_js_sdk_1 = require("casper-js-sdk");
var ts_results_1 = require("ts-results");
var constants_1 = require("./constants");
var gateway_token_1 = require("./gateway-token");
var utils = __importStar(require("./utils"));
var KycTokenClient = /** @class */ (function () {
    /**
     * Construct the KYC Token Client
     * @param nodeAddress
     * @param chainName
     * @param masterKey - keypair which is allowed to make changes to the KYC Token
     */
    function KycTokenClient(nodeAddress, chainName, masterKey) {
        this.nodeAddress = nodeAddress;
        this.chainName = chainName;
        this.masterKey = masterKey;
    }
    KycTokenClient.prototype.setContractHash = function (hash) {
        return __awaiter(this, void 0, void 0, function () {
            var stateRootHash, contractData, _a, contractPackageHash, namedKeys, LIST_OF_NAMED_KEYS;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, utils.getStateRootHash(this.nodeAddress)];
                    case 1:
                        stateRootHash = _b.sent();
                        return [4 /*yield*/, utils.getContractData(this.nodeAddress, stateRootHash, hash)];
                    case 2:
                        contractData = _b.sent();
                        _a = contractData.Contract, contractPackageHash = _a.contractPackageHash, namedKeys = _a.namedKeys;
                        this.contractHash = hash;
                        this.contractPackageHash = contractPackageHash.replace("contract-package-wasm", "");
                        LIST_OF_NAMED_KEYS = [
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
                        this.namedKeys = namedKeys.reduce(function (acc, val) {
                            var _a;
                            if (LIST_OF_NAMED_KEYS.includes(val.name)) {
                                return __assign(__assign({}, acc), (_a = {}, _a[utils.camelCased(val.name)] = val.key, _a));
                            }
                            return acc;
                        }, {});
                        return [2 /*return*/];
                }
            });
        });
    };
    KycTokenClient.prototype.name = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, contractSimpleGetter(this.nodeAddress, this.contractHash, ["name"])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.value()];
                }
            });
        });
    };
    KycTokenClient.prototype.symbol = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, contractSimpleGetter(this.nodeAddress, this.contractHash, ["symbol"])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.value()];
                }
            });
        });
    };
    KycTokenClient.prototype.meta = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, res, jsMap, _i, res_1, _a, innerKey, value;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, contractSimpleGetter(this.nodeAddress, this.contractHash, ["meta"])];
                    case 1:
                        result = _b.sent();
                        res = result.value();
                        jsMap = new Map();
                        for (_i = 0, res_1 = res; _i < res_1.length; _i++) {
                            _a = res_1[_i], innerKey = _a[0], value = _a[1];
                            jsMap.set(innerKey.value(), value.value());
                        }
                        return [2 /*return*/, jsMap];
                }
            });
        });
    };
    KycTokenClient.prototype.balanceOf = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var accountHash, result, maybeValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accountHash = Buffer.from(account.toAccountHash()).toString("hex");
                        return [4 /*yield*/, utils.contractDictionaryGetter(this.nodeAddress, accountHash, this.namedKeys.balances)];
                    case 1:
                        result = _a.sent();
                        maybeValue = result === null || result === void 0 ? void 0 : result.value().unwrap();
                        return [2 /*return*/, maybeValue.value().toString()];
                }
            });
        });
    };
    KycTokenClient.prototype.getOwnerOf = function (tokenId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, maybeValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils.contractDictionaryGetter(this.nodeAddress, tokenId, this.namedKeys.owners)];
                    case 1:
                        result = _a.sent();
                        maybeValue = result.value().unwrap();
                        return [2 /*return*/, "account-hash-" + Buffer.from(maybeValue.value().value()).toString("hex")];
                }
            });
        });
    };
    KycTokenClient.prototype.getIssuerOf = function (tokenId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, maybeValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils.contractDictionaryGetter(this.nodeAddress, tokenId, this.namedKeys.issuers)];
                    case 1:
                        result = _a.sent();
                        maybeValue = result.value().unwrap();
                        return [2 /*return*/, "account-hash-" + Buffer.from(maybeValue.value().value()).toString("hex")];
                }
            });
        });
    };
    KycTokenClient.prototype.totalSupply = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, contractSimpleGetter(this.nodeAddress, this.contractHash, ["total_supply"])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.value()];
                }
            });
        });
    };
    /**
     * Return the KYC Token associated with the given account
     * @param account
     */
    KycTokenClient.prototype.getGatewayToken = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var kycToken, result, maybeValue, map, jsMap, _i, map_1, _a, innerKey, value;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getKYCToken(account)];
                    case 1:
                        kycToken = _b.sent();
                        if (!kycToken) {
                            return [2 /*return*/, new Promise(function (resolve) { return resolve(undefined); })];
                        }
                        return [4 /*yield*/, utils.contractDictionaryGetter(this.nodeAddress, kycToken, this.namedKeys.metadata)];
                    case 2:
                        result = _b.sent();
                        maybeValue = result.value().unwrap();
                        map = maybeValue.value();
                        jsMap = new Map();
                        for (_i = 0, map_1 = map; _i < map_1.length; _i++) {
                            _a = map_1[_i], innerKey = _a[0], value = _a[1];
                            jsMap.set(innerKey.value(), value.value());
                        }
                        return [2 /*return*/, new Promise(function (resolve) { return resolve(gateway_token_1.GatewayToken.of(account, kycToken, jsMap)); })];
                }
            });
        });
    };
    /**
     * Test if the KYC Token contract is paused
     */
    // TODO: Error: state query failed: ValueNotFound
    KycTokenClient.prototype.isPaused = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, contractSimpleGetter(this.nodeAddress, this.contractHash, ["is_paused"])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.value()];
                }
            });
        });
    };
    /**
     * This is a contract level function, where we request a new gatekeeper to be whitelisted
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    KycTokenClient.prototype.addGatekeeper = function (account, paymentAmount, ttl) {
        if (paymentAmount === void 0) { paymentAmount = constants_1.WHITELIST_PAYMENT_AMOUNT; }
        if (ttl === void 0) { ttl = constants_1.DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function () {
            var runtimeArgs;
            return __generator(this, function (_a) {
                runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                    gatekeeper: utils.createRecipientAddress(account),
                });
                return [2 /*return*/, contractCall({
                        chainName: this.chainName,
                        contractHash: this.contractHash,
                        entryPoint: "grant_gatekeeper",
                        keys: this.masterKey,
                        nodeAddress: this.nodeAddress,
                        paymentAmount: paymentAmount,
                        runtimeArgs: runtimeArgs,
                        ttl: ttl
                    })];
            });
        });
    };
    /**
     * This is a contract level function, where we request a gatekeeper to be removed
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    KycTokenClient.prototype.revokeGatekeeper = function (account, paymentAmount, ttl) {
        if (paymentAmount === void 0) { paymentAmount = constants_1.WHITELIST_PAYMENT_AMOUNT; }
        if (ttl === void 0) { ttl = constants_1.DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function () {
            var runtimeArgs;
            return __generator(this, function (_a) {
                runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                    gatekeeper: utils.createRecipientAddress(account),
                });
                return [2 /*return*/, contractCall({
                        chainName: this.chainName,
                        contractHash: this.contractHash,
                        entryPoint: "revoke_gatekeeper",
                        keys: this.masterKey,
                        nodeAddress: this.nodeAddress,
                        paymentAmount: paymentAmount,
                        runtimeArgs: runtimeArgs,
                        ttl: ttl
                    })];
            });
        });
    };
    /**
     * Issue a KYC Token to the given account
     * @param account
     * @param token
     * @param paymentAmount
     * @param ttl
     */
    KycTokenClient.prototype.issue = function (token, paymentAmount, ttl) {
        if (paymentAmount === void 0) { paymentAmount = constants_1.MINT_PAYMENT_AMOUNT; }
        if (ttl === void 0) { ttl = constants_1.DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function () {
            var tokenId, runtimeArgs;
            return __generator(this, function (_a) {
                tokenId = casper_js_sdk_1.CLValueBuilder.option(ts_results_1.None, casper_js_sdk_1.CLTypeBuilder.string());
                runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                    recipient: utils.createRecipientAddress(token.account),
                    token_id: tokenId,
                    token_meta: token.toClMap(),
                });
                return [2 /*return*/, contractCall({
                        chainName: this.chainName,
                        contractHash: this.contractHash,
                        entryPoint: "mint",
                        keys: this.masterKey,
                        nodeAddress: this.nodeAddress,
                        paymentAmount: paymentAmount,
                        runtimeArgs: runtimeArgs,
                        ttl: ttl
                    })];
            });
        });
    };
    /**
     * Update the state of the KYC Token in the given account
     * @param account
     * @param state
     * @param paymentAmount
     */
    KycTokenClient.prototype.updateState = function (account, state, paymentAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var kycToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGatewayToken(account)];
                    case 1:
                        kycToken = _a.sent();
                        if (!kycToken) {
                            throw Error("KYC Token not found for account: " + account.toHex());
                        }
                        return [2 /*return*/, this.updateTokenMetadata(kycToken, casper_js_sdk_1.CLValueBuilder.string("state"), casper_js_sdk_1.CLValueBuilder.string(state), paymentAmount)];
                }
            });
        });
    };
    /**
     * Revoke the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    KycTokenClient.prototype.revoke = function (account, paymentAmount) {
        if (paymentAmount === void 0) { paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateState(account, gateway_token_1.State.REVOKED, paymentAmount)];
            });
        });
    };
    /**
     * Freeze the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    KycTokenClient.prototype.freeze = function (account, paymentAmount) {
        if (paymentAmount === void 0) { paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateState(account, gateway_token_1.State.FROZEN, paymentAmount)];
            });
        });
    };
    /**
     * Unfreeze the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    KycTokenClient.prototype.unfreeze = function (account, paymentAmount) {
        if (paymentAmount === void 0) { paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateState(account, gateway_token_1.State.ACTIVE, paymentAmount)];
            });
        });
    };
    /**
     * Update the expiry of the KYC Token belonging to this account
     * @param account
     * @param expireTime
     * @param paymentAmount
     */
    KycTokenClient.prototype.updateExpiry = function (account, expireTime, paymentAmount) {
        if (paymentAmount === void 0) { paymentAmount = constants_1.UPDATE_PAYMENT_AMOUNT; }
        return __awaiter(this, void 0, void 0, function () {
            var kycToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getGatewayToken(account)];
                    case 1:
                        kycToken = _a.sent();
                        if (!kycToken) {
                            throw Error("KYC Token not found for account: " + account.toHex());
                        }
                        // Check what we need to do here
                        if (expireTime) {
                            return [2 /*return*/, this.updateTokenMetadata(kycToken, casper_js_sdk_1.CLValueBuilder.string("expiry"), casper_js_sdk_1.CLValueBuilder.string(expireTime), paymentAmount)];
                        }
                        // Expiry time removed, so reset the state completely
                        return [2 /*return*/, this.setTokenMetadata(kycToken.withExpiry(expireTime), paymentAmount)];
                }
            });
        });
    };
    /**
     * Confirm that the given hash has been deployed, poll this till either an exception is thrown indicating error
     * or a valid deployment result is returned
     * @param deployHash
     */
    KycTokenClient.prototype.confirmDeploy = function (deployHash) {
        return __awaiter(this, void 0, void 0, function () {
            var client, _a, deploy, raw;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        client = new casper_js_sdk_1.CasperClient(this.nodeAddress);
                        return [4 /*yield*/, client.getDeploy(deployHash)];
                    case 1:
                        _a = _b.sent(), deploy = _a[0], raw = _a[1];
                        if (raw.execution_results.length !== 0) {
                            // @ts-ignore
                            if (raw.execution_results[0].result.Success) {
                                return [2 /*return*/, new Promise(function (resolve) { return resolve(deploy); })];
                            }
                            else {
                                // @ts-ignore
                                throw Error("Contract execution: " + raw.execution_results[0].result.Failure.error_message);
                            }
                        }
                        return [2 /*return*/, new Promise(function (resolve) { return resolve(undefined); })];
                }
            });
        });
    };
    KycTokenClient.prototype.getKYCToken = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var accountKey, accountBytes, balanceOri, balance, _loop_1, this_1, i, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accountKey = utils.createRecipientAddress(account);
                        accountBytes = casper_js_sdk_1.CLValueParsers.toBytes(accountKey).unwrap();
                        return [4 /*yield*/, this.balanceOf(account)];
                    case 1:
                        balanceOri = _a.sent();
                        balance = parseInt(balanceOri, 10);
                        _loop_1 = function (i) {
                            var numBytes, concated, blaked, str, result, maybeValue_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        numBytes = casper_js_sdk_1.CLValueParsers.toBytes(casper_js_sdk_1.CLValueBuilder.u256(i)).unwrap();
                                        concated = bytes_1.concat([accountBytes, numBytes]);
                                        blaked = blakejs_1.default.blake2b(concated, undefined, 32);
                                        str = Buffer.from(blaked).toString("hex");
                                        if (!(str === this_1.contractHash)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, utils.contractDictionaryGetter(this_1.nodeAddress, str, this_1.namedKeys.ownedTokensByIndex)];
                                    case 1:
                                        result = _a.sent();
                                        maybeValue_1 = result.value().unwrap();
                                        return [2 /*return*/, { value: new Promise(function (resolve) { return resolve(maybeValue_1.value()); }) }];
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < balance)) return [3 /*break*/, 5];
                        return [5 /*yield**/, _loop_1(i)];
                    case 3:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, new Promise(function (resolve) { return resolve(undefined); })];
                }
            });
        });
    };
    /**
     * The set function updates the entire metadata object
     * @param token
     * @param paymentAmount
     * @param ttl
     */
    KycTokenClient.prototype.setTokenMetadata = function (token, paymentAmount, ttl) {
        if (ttl === void 0) { ttl = constants_1.DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function () {
            var runtimeArgs;
            return __generator(this, function (_a) {
                if (!token.tokenId) {
                    throw Error("Cannot set KYC Token Metadata with no id!");
                }
                runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                    token_id: casper_js_sdk_1.CLValueBuilder.string(token.tokenId),
                    token_meta: token.toClMap(),
                });
                return [2 /*return*/, contractCall({
                        chainName: this.chainName,
                        contractHash: this.contractHash,
                        entryPoint: "set_token_meta",
                        keys: this.masterKey,
                        nodeAddress: this.nodeAddress,
                        paymentAmount: paymentAmount,
                        runtimeArgs: runtimeArgs,
                        ttl: ttl
                    })];
            });
        });
    };
    /**
     * The update fundtion only needs the metadata that needs to change per Casper
     * @param token
     * @param metaKey
     * @param metaValue
     * @param paymentAmount
     * @param ttl
     */
    KycTokenClient.prototype.updateTokenMetadata = function (token, metaKey, metaValue, paymentAmount, ttl) {
        if (ttl === void 0) { ttl = constants_1.DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function () {
            var runtimeArgs;
            return __generator(this, function (_a) {
                if (!token.tokenId) {
                    throw Error("Cannot update KYC Token Metadata with no id!");
                }
                runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                    token_id: casper_js_sdk_1.CLValueBuilder.string(token.tokenId),
                    token_meta_key: metaKey,
                    token_meta_value: metaValue
                });
                return [2 /*return*/, contractCall({
                        chainName: this.chainName,
                        contractHash: this.contractHash,
                        entryPoint: "update_token_metadata",
                        keys: this.masterKey,
                        nodeAddress: this.nodeAddress,
                        paymentAmount: paymentAmount,
                        runtimeArgs: runtimeArgs,
                        ttl: ttl
                    })];
            });
        });
    };
    return KycTokenClient;
}());
exports.KycTokenClient = KycTokenClient;
var contractCall = function (_a) {
    var nodeAddress = _a.nodeAddress, keys = _a.keys, chainName = _a.chainName, contractHash = _a.contractHash, entryPoint = _a.entryPoint, runtimeArgs = _a.runtimeArgs, paymentAmount = _a.paymentAmount, ttl = _a.ttl;
    return __awaiter(void 0, void 0, void 0, function () {
        var client, contractHashAsByteArray, deploy;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    client = new casper_js_sdk_1.CasperClient(nodeAddress);
                    contractHashAsByteArray = utils.contractHashToByteArray(contractHash);
                    deploy = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(keys.publicKey, chainName, 1, ttl), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newStoredContractByHash(contractHashAsByteArray, entryPoint, runtimeArgs), casper_js_sdk_1.DeployUtil.standardPayment(paymentAmount));
                    // Sign deploy.
                    deploy = client.signDeploy(deploy, keys);
                    return [4 /*yield*/, client.putDeploy(deploy)];
                case 1: 
                // Dispatch deploy to node.
                return [2 /*return*/, _b.sent()];
            }
        });
    });
};
var contractSimpleGetter = function (nodeAddress, contractHash, key) { return __awaiter(void 0, void 0, void 0, function () {
    var stateRootHash, clValue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, utils.getStateRootHash(nodeAddress)];
            case 1:
                stateRootHash = _a.sent();
                return [4 /*yield*/, utils.getContractData(nodeAddress, stateRootHash, contractHash, key)];
            case 2:
                clValue = _a.sent();
                if (clValue && clValue.CLValue instanceof casper_js_sdk_1.CLValue) {
                    return [2 /*return*/, clValue.CLValue];
                }
                else {
                    throw Error("Invalid stored value");
                }
                return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=kyc-token-client.js.map