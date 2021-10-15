"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayToken = exports.State = void 0;
var casper_js_sdk_1 = require("casper-js-sdk");
var State;
(function (State) {
    State["ACTIVE"] = "Active";
    State["REVOKED"] = "Revoked";
    State["FROZEN"] = "Frozen";
})(State = exports.State || (exports.State = {}));
var GatewayToken = /** @class */ (function () {
    function GatewayToken(
    // Account of the Gatekeeper that is issuing the KYC Tokens
    issuingGatekeeper, 
    // Contract hash of the KYC Token <-- hardcode based on deployment in whichever network(test/main)
    gatekeeperNetwork, account, status, expiryTime, tokenId) {
        this.issuingGatekeeper = issuingGatekeeper;
        this.gatekeeperNetwork = gatekeeperNetwork;
        this.account = account;
        this.status = status;
        this.expiryTime = expiryTime;
        this.tokenId = tokenId;
    }
    GatewayToken.of = function (account, tokenId, meta) {
        return new GatewayToken(casper_js_sdk_1.CLPublicKey.fromHex(meta.get('issuer')), meta.get('network'), account, meta.get('status'), meta.get('expiry'), tokenId);
    };
    GatewayToken.prototype.isValid = function () {
        return this.status === State.ACTIVE && !this.hasExpired();
    };
    GatewayToken.prototype.hasExpired = function () {
        var now = Math.floor(Date.now() / 1000);
        return !!this.expiryTime && now > parseInt(this.expiryTime);
    };
    GatewayToken.prototype.toClMap = function () {
        var clMap = casper_js_sdk_1.CLValueBuilder.map([
            casper_js_sdk_1.CLTypeBuilder.string(),
            casper_js_sdk_1.CLTypeBuilder.string(),
        ]);
        clMap.set(casper_js_sdk_1.CLValueBuilder.string("issuer"), casper_js_sdk_1.CLValueBuilder.string(this.issuingGatekeeper.toHex()));
        clMap.set(casper_js_sdk_1.CLValueBuilder.string("network"), casper_js_sdk_1.CLValueBuilder.string(this.gatekeeperNetwork));
        clMap.set(casper_js_sdk_1.CLValueBuilder.string("status"), casper_js_sdk_1.CLValueBuilder.string(this.status));
        if (this.expiryTime) {
            clMap.set(casper_js_sdk_1.CLValueBuilder.string("expiry"), casper_js_sdk_1.CLValueBuilder.string(this.expiryTime));
        }
        return clMap;
    };
    /**
     * New token with just the expiry mutated
     * @param expiryTime
     */
    GatewayToken.prototype.withExpiry = function (expiryTime) {
        return new GatewayToken(this.issuingGatekeeper, this.gatekeeperNetwork, this.account, this.status, expiryTime, this.tokenId);
    };
    return GatewayToken;
}());
exports.GatewayToken = GatewayToken;
//# sourceMappingURL=gateway-token.js.map