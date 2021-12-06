import { CLPublicKey, CLValue, GetDeployResult, RuntimeArgs } from "casper-js-sdk";
import { Deploy } from "casper-js-sdk/dist/lib/DeployUtil";
import { StoredValue } from "casper-js-sdk/dist/lib/StoredValue";
import { NodeResolver } from "./node-resolver";
export interface IContractCallParams {
    contractHash: string;
    entryPoint: string;
    paymentAmount: string;
    runtimeArgs: RuntimeArgs;
    ttl: number;
    recipient?: string;
}
export interface IInstallParams {
    pathToContract: string;
    paymentAmount: string;
    runtimeArgs: RuntimeArgs;
}
export declare class CasperExecutor {
    readonly resolver: NodeResolver;
    constructor(resolver: NodeResolver);
    getPublicKey(): Promise<CLPublicKey>;
    /**
     * Execute a contract call that requires a signature
     * @param params
     */
    call(params: IContractCallParams): Promise<string>;
    /**
     * Install a given contract
     * @param params
     */
    install(params: IInstallParams): Promise<string>;
    /**
     * Get result of a deploy
     * @param deployHash
     */
    getDeploy(deployHash: string): Promise<[Deploy, GetDeployResult]>;
    /**
     * Get the contract data for the given path, default everything
     * @param contractHash
     * @param path
     */
    getContractData(contractHash: string, path?: string[]): Promise<StoredValue>;
    /**
     * Get the specific key from the given contract
     * @param contractHash
     * @param keys
     */
    getContractKey(contractHash: string, keys: string[]): Promise<CLValue>;
    /**
     *
     * @param dictionaryItemKey
     * @param seedUref
     */
    getContractDictionaryKey(dictionaryItemKey: string, seedUref: string): Promise<CLValue>;
    private getStateRootHash;
}
