import {CasperClient, CasperServiceByJsonRPC, CLPublicKey, CLValue, GetDeployResult, RuntimeArgs} from "casper-js-sdk";
import {Deploy} from "casper-js-sdk/dist/lib/DeployUtil";
import {StoredValue} from "casper-js-sdk/dist/lib/StoredValue";
import {NodeResolver} from "./node-resolver";

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

export class CasperExecutor {

  constructor(
    readonly resolver: NodeResolver
  ) {
  }

  public async getPublicKey(): Promise<CLPublicKey> {
    throw Error('Not implemented!');
  }

  /**
   * Execute a contract call that requires a signature
   * @param params
   */
  public async call(params: IContractCallParams): Promise<string> {
    throw Error('Not implemented!');
  }

  /**
   * Install a given contract
   * @param params
   */
  public async install(params: IInstallParams): Promise<string> {
    throw Error('Not implemented!');
  }

  /**
   * Get result of a deploy
   * @param deployHash
   */
  public async getDeploy(deployHash: string): Promise<[Deploy, GetDeployResult]> {
    const client = new CasperClient(this.resolver.getAddress());
    return await client.getDeploy(deployHash);
  }

  /**
   * Get the contract data for the given path, default everything
   * @param contractHash
   * @param path
   */
  public async getContractData(
    contractHash: string,
    path: string[] = []
  ): Promise<StoredValue> {
    const client = new CasperServiceByJsonRPC(this.resolver.getAddress());
    const stateRootHash = await this.getStateRootHash(client);
    return await client.getBlockState(
      stateRootHash,
      `hash-${contractHash}`,
      path
    );
  }

  /**
   * Get the specific key from the given contract
   * @param contractHash
   * @param keys
   */
  public async getContractKey(contractHash: string, keys: string[]): Promise<CLValue> {
    const clValue = await this.getContractData(
      contractHash,
      keys
    )

    if (clValue && clValue.CLValue instanceof CLValue) {
      return new Promise((r) => r(clValue.CLValue!));
    }
    throw Error("Invalid stored value");
  }

  /**
   *
   * @param dictionaryItemKey
   * @param seedUref
   */
  public async getContractDictionaryKey(
    dictionaryItemKey: string,
    seedUref: string,
  ): Promise<CLValue> {
    const client = new CasperServiceByJsonRPC(this.resolver.getAddress());
    const stateRootHash = await this.getStateRootHash(client);

    const storedValue = await client.getDictionaryItemByURef(
      stateRootHash,
      dictionaryItemKey,
      seedUref
    );

    if (storedValue && storedValue.CLValue instanceof CLValue) {
      return new Promise((r) => r(storedValue.CLValue!));
    }
    throw Error("Invalid stored value");
  }

  private async getStateRootHash(client: CasperServiceByJsonRPC): Promise<string> {
    const {block} = await client.getLatestBlockInfo();
    if (block) {
      return new Promise((r) => r(block.header.state_root_hash));
    } else {
      throw Error("Problem when calling getLatestBlockInfo");
    }
  }
}

