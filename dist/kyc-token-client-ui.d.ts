import { CLPublicKey, DeployUtil } from "casper-js-sdk";
import { GatewayToken } from "./gateway-token";
export declare class KycTokenUIClient {
    private nodeAddress;
    private chainName;
    private contractHash;
    private contractPackageHash;
    private namedKeys;
    /**
     * Construct the KYC Token Client
     * @param nodeAddress
     * @param chainName
     */
    constructor(nodeAddress: string, chainName: string);
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
     * Confirm that the given hash has been deployed, poll this till either an exception is thrown indicating error
     * or a valid deployment result is returned
     * @param deployHash
     */
    confirmDeploy(deployHash: string): Promise<DeployUtil.Deploy | undefined>;
    private getKYCToken;
}
