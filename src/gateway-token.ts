import { CLPublicKey } from "casper-js-sdk";
import {DEFAULT_TTL} from "./constants";

export enum State {
    ACTIVE = "ACTIVE",
    REVOKED = "REVOKED",
    FROZEN = "FROZEN",
}
export class GatewayToken {
    constructor(
        // TODO: Check with Civic/Casper whether this information is in the metadata of the KYC Token NFT
        //  the key used to reference the issuing gatekeeper
        readonly issuingGatekeeper: CLPublicKey,
        readonly gatekeeperNetwork: CLPublicKey,
        readonly owner: CLPublicKey,
        readonly state: State,
        readonly publicKey: CLPublicKey,
        readonly programId: CLPublicKey,
        readonly expiryTime?: number
    ) {}

    public isValid(): boolean {
        return this.state === State.ACTIVE && !this.hasExpired();
    }

    private hasExpired(): boolean {
        const now = Math.floor(Date.now() / 1000);
        return !!this.expiryTime && now > this.expiryTime;
    }

    public static of(meta: Map<string, string>): GatewayToken {
        const expiry = meta.get('expiry') ?? DEFAULT_TTL.toString();


        return new GatewayToken(
            CLPublicKey.fromHex(meta.get('issuer')!),
            CLPublicKey.fromHex(meta.get('network')!),
                CLPublicKey.fromHex(meta.get('owner')!),
            meta.get('state')! as State,
                    CLPublicKey.fromHex(meta.get('publicKey')!),
                        CLPublicKey.fromHex(meta.get('programId')!),
            parseInt(expiry),
        )
    }
}