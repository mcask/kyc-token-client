import { CLPublicKey } from "casper-js-sdk";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
import { CasperExecutor, IContractCallParams, IInstallParams } from "./executor-base";
import { NodeResolver } from "./node-resolver";
export declare class LocalCasperExecutor extends CasperExecutor {
    readonly key: AsymmetricKey;
    constructor(resolver: NodeResolver, key: AsymmetricKey);
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
