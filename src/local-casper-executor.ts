import {CasperClient, CLPublicKey, DeployUtil} from "casper-js-sdk";
import {AsymmetricKey} from "casper-js-sdk/dist/lib/Keys";
import {CasperExecutor, IContractCallParams, IInstallParams} from "./executor-base";
import {NodeResolver} from "./node-resolver";
import * as utils from "./utils";

export class LocalCasperExecutor extends CasperExecutor {

  constructor(
    resolver: NodeResolver,
    readonly key: AsymmetricKey
  ) {
    super(resolver);
  }

  public async getPublicKey(): Promise<CLPublicKey> {
    return new Promise(r => r(this.key.publicKey));
  }

  /**
   * Execute a contract call
   * @param params
   */
  public async call(params: IContractCallParams): Promise<string> {
    const client = new CasperClient(this.resolver.getAddress());
    const contractHashAsByteArray = utils.contractHashToByteArray(params.contractHash);

    let deploy = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(this.key.publicKey, this.resolver.chain, 1, params.ttl),
      DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        contractHashAsByteArray,
        params.entryPoint,
        params.runtimeArgs
      ),
      DeployUtil.standardPayment(params.paymentAmount)
    );

    // Sign deploy.
    deploy = client.signDeploy(deploy, this.key);

    // Dispatch deploy to node.
    return await client.putDeploy(deploy);
  }

  /**
   * Install the given contract
   * @param params
   */
  public async install(params: IInstallParams): Promise<string> {
    const client = new CasperClient(this.resolver.getAddress());

    // Set contract installation deploy (unsigned).
    let deploy = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(
        CLPublicKey.fromHex(this.key.publicKey.toHex()),
        this.resolver.chain
      ),
      DeployUtil.ExecutableDeployItem.newModuleBytes(
        utils.getBinary(params.pathToContract),
        params.runtimeArgs
      ),
      DeployUtil.standardPayment(params.paymentAmount)
    );

    // Sign deploy.
    deploy = client.signDeploy(deploy, this.key);

    // Dispatch deploy to node.
    return await client.putDeploy(deploy);
  }
}