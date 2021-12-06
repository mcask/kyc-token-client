import { CLPublicKey, CLValue, DeployUtil } from "casper-js-sdk";
import { GatewayToken, State } from "./gateway-token";
import { CasperExecutor } from "./executor-base";
export declare class KycTokenClient {
    readonly executor: CasperExecutor;
    private contractHash;
    private contractPackageHash;
    private namedKeys;
    /**
     * Construct the KYC Token Client
     * @param executor this does the work on the blockchain
     */
    constructor(executor: CasperExecutor);
    /**
     * Set the hash for this contract
     * @param hash
     */
    setContractHash(hash: string): Promise<void>;
    name(): Promise<any>;
    symbol(): Promise<any>;
    meta(): Promise<Map<any, any>>;
    balanceOf(account: CLPublicKey): Promise<any>;
    getOwnerOf(tokenId: string): Promise<string>;
    getIssuerOf(tokenId: string): Promise<string>;
    totalSupply(): Promise<any>;
    /**
     * Return the KYC Token associated with the given account
     * @param account
     */
    getGatewayToken(account: CLPublicKey): Promise<GatewayToken | undefined>;
    /**
     * Test if the KYC Token contract is paused
     */
    isPaused(): Promise<any>;
    /**
     * This is a contract level function, where we request a new admin to be whitelisted
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    addAdmin(account: CLPublicKey, paymentAmount?: string, ttl?: number): Promise<string>;
    /**
     * This is a contract level function, where we request an admin to be removed
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    revokeAdmin(account: CLPublicKey, paymentAmount?: string, ttl?: number): Promise<string>;
    /**
     * This is a contract level function, where we request a new gatekeeper to be whitelisted
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    addGatekeeper(account: CLPublicKey, paymentAmount?: string, ttl?: number): Promise<string>;
    /**
     * This is a contract level function, where we request a gatekeeper to be removed
     * @param account
     * @param paymentAmount
     * @param ttl
     */
    revokeGatekeeper(account: CLPublicKey, paymentAmount?: string, ttl?: number): Promise<string>;
    /**
     * Issue a KYC Token to the given account
     * @param account
     * @param token
     * @param paymentAmount
     * @param ttl
     */
    issue(token: GatewayToken, paymentAmount?: string, ttl?: number): Promise<string>;
    /**
     * Update the state of the KYC Token in the given account
     * @param account
     * @param state
     * @param paymentAmount
     */
    updateState(account: CLPublicKey, state: State, paymentAmount: string): Promise<string>;
    /**
     * Revoke the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    revoke(account: CLPublicKey, paymentAmount?: string): Promise<string>;
    /**
     * Freeze the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    freeze(account: CLPublicKey, paymentAmount?: string): Promise<string>;
    /**
     * Unfreeze the KYC Token belonging to this account
     * @param account
     * @param paymentAmount
     */
    unfreeze(account: CLPublicKey, paymentAmount?: string): Promise<string>;
    /**
     * Update the expiry of the KYC Token belonging to this account
     * @param account
     * @param expireTime
     * @param paymentAmount
     */
    updateExpiry(account: CLPublicKey, expireTime?: string, paymentAmount?: string): Promise<string>;
    /**
     * Confirm that the given hash has been deployed, poll this till either an exception is thrown indicating error
     * or a valid deployment result is returned
     * @param deployHash
     */
    confirmDeploy(deployHash: string): Promise<DeployUtil.Deploy | undefined>;
    getKYCToken(account: CLPublicKey): Promise<string | undefined>;
    /**
     * The set function updates the entire metadata object
     * @param token
     * @param paymentAmount
     * @param ttl
     */
    private setTokenMetadata;
    /**
     * The update fundtion only needs the metadata that needs to change per Casper
     * @param token
     * @param metaKey
     * @param metaValue
     * @param paymentAmount
     * @param ttl
     */
    updateTokenMetadata(token: GatewayToken, metaKey: CLValue, metaValue: CLValue, paymentAmount: string, ttl?: number): Promise<string>;
}
