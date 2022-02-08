import { CLMap, CLPublicKey, CLValue } from "casper-js-sdk";
export declare enum State {
    ACTIVE = "active",
    REVOKED = "revoked",
    FROZEN = "frozen"
}
export declare class GatewayToken {
    readonly issuingGatekeeper: CLPublicKey;
    readonly gatekeeperNetwork: string;
    readonly account: CLPublicKey;
    readonly status: State;
    readonly expiryTime?: string | undefined;
    readonly tokenId?: string | undefined;
    static of(account: CLPublicKey, tokenId: string, meta: Map<string, string>): GatewayToken;
    constructor(issuingGatekeeper: CLPublicKey, gatekeeperNetwork: string, account: CLPublicKey, status: State, expiryTime?: string | undefined, tokenId?: string | undefined);
    isValid(): boolean;
    hasExpired(): boolean;
    toClMap(): CLMap<CLValue, CLValue>;
    /**
     * New token with just the expiry mutated
     * @param expiryTime
     */
    withExpiry(expiryTime?: string): GatewayToken;
}
