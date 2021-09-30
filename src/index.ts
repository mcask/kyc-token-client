// import CEP47Client from "./cep47-client";
// import * as utils from "./utils";
// import * as constants from "./constants";
import {
    CLPublicKey,
} from "casper-js-sdk";

export class GatekeeperService {
    /**
     * Construct a new GatekeeperService instance
     * @param connection A Casper connection object
     * @param payer The payer for any transactions performed by the gatekeeper
     * @param gatekeeperNetwork The network that the gatekeeper belongs to
     * @param gatekeeperAuthority The gatekeeper's key
     * @param config Global default configuration for the gatekeeper
     */
    constructor(
        private connection: Connection,
        private payer: Keypair,
        private gatekeeperNetwork: CLPublicKey,
        private gatekeeperAuthority: Keypair,
        private config: GatekeeperConfig = {}
    ) {}

    private getDefaultExpireTime(): number | undefined {
        if (!this.config.defaultExpirySeconds) return undefined;
        const now = Math.floor(Date.now() / 1000);
        return now + this.config.defaultExpirySeconds;
    }

    private getGatewayTokenOrError(
        gatewayTokenKey: CLPublicKey
    ): Promise<GatewayToken> {
        return getGatewayToken(this.connection, gatewayTokenKey).then(
            (gatewayToken: GatewayToken | null) => {
                if (!gatewayToken)
                    throw new Error(
                        "Error retrieving gateway token at address " + gatewayTokenKey
                    );
                return gatewayToken;
            }
        );
    }

    private async issueVanilla(
        owner: CLPublicKey,
        seed?: Uint8Array
    ): Promise<GatewayToken> {
        // Mint
    }

    /**
     * Issue a token to this recipient
     * @param recipient
     */
    issue(recipient: CLPublicKey): Promise<GatewayToken> {
        return this.issueVanilla(recipient);
    }

    /**
     * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
     * @param gatewayTokenKey
     */
    async revoke(gatewayTokenKey: CLPublicKey): Promise<GatewayToken> {
        // Call "revoke"
    }

    /**
     * Freeze the gateway token. The token must have been issued by this gatekeeper.
     * @param gatewayTokenKey
     */
    async freeze(gatewayTokenKey: CLPublicKey): Promise<GatewayToken> {
        // Call "freeze"
    }

    /**
     * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
     * @param gatewayTokenKey
     */
    async unfreeze(gatewayTokenKey: CLPublicKey): Promise<GatewayToken> {
        // Call "unfreeze"
    }

    /**
     * Returns a gateway token owned by this owner, if it exists
     * @param owner
     */
    async findGatewayTokenForOwner(
        owner: CLPublicKey
    ): Promise<GatewayToken | null> {
        return findGatewayToken(this.connection, owner, this.gatekeeperNetwork);
    }

    /**
     * Update the expiry time of the gateway token. The token must have been issued by this gatekeeper.
     * @param gatewayTokenKey
     * @param expireTime
     */
    async updateExpiry(
        gatewayTokenKey: CLPublicKey,
        expireTime: number
    ): Promise<GatewayToken> {
        // Call updateExpiry on token
    }

    // equivalent to GatekeeperNetworkService.hasGatekeeper, but requires no network private key
    async isRegistered(): Promise<boolean> {
        const gatekeeperAccount = await getGatekeeperAccountKey(
            this.gatekeeperAuthority.CLPublicKey,
            this.gatekeeperNetwork
        );
        const gatekeeperAccountInfo = await this.connection.getAccountInfo(
            gatekeeperAccount
        );

        return !!gatekeeperAccountInfo;
    }
}
