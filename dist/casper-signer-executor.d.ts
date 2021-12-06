import { CLPublicKey } from "casper-js-sdk";
import { CasperExecutor, IContractCallParams, IInstallParams } from "./executor-base";
import { NodeResolver } from "./node-resolver";
export declare class CasperSignerExecutor extends CasperExecutor {
    constructor(resolver: NodeResolver);
    getPublicKey(): Promise<CLPublicKey>;
    /**
     * Execute a contract call
     * @param params
     */
    call(params: IContractCallParams): Promise<string>;
    /**
     * Install the given contract
     * @param params
     */
    install(params: IInstallParams): Promise<string>;
}
