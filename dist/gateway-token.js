"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayToken = exports.State = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
var State;
(function (State) {
    State["ACTIVE"] = "active";
    State["REVOKED"] = "revoked";
    State["FROZEN"] = "frozen";
})(State = exports.State || (exports.State = {}));
const toState = (st) => {
    const stl = st.toLowerCase();
    if (stl === 'active') {
        return State.ACTIVE;
    }
    if (stl === 'revoked') {
        return State.REVOKED;
    }
    return State.FROZEN;
};
class GatewayToken {
    constructor(
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
    static of(account, tokenId, meta) {
        return new GatewayToken(casper_js_sdk_1.CLPublicKey.fromHex(meta.get('issuer')), meta.get('network'), account, toState(meta.get('status')), meta.get('expiry'), tokenId);
    }
    isValid() {
        return this.status === State.ACTIVE && !this.hasExpired();
    }
    hasExpired() {
        const now = Math.floor(Date.now() / 1000);
        return !!this.expiryTime && now > parseInt(this.expiryTime);
    }
    toClMap() {
        const clMap = casper_js_sdk_1.CLValueBuilder.map([
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
    }
    /**
     * New token with just the expiry mutated
     * @param expiryTime
     */
    withExpiry(expiryTime) {
        return new GatewayToken(this.issuingGatekeeper, this.gatekeeperNetwork, this.account, this.status, expiryTime, this.tokenId);
    }
}
exports.GatewayToken = GatewayToken;
//# sourceMappingURL=gateway-token.js.map