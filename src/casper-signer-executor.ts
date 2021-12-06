import {CasperClient, CLPublicKey, DeployUtil, Signer} from "casper-js-sdk";
import {CasperExecutor, IContractCallParams, IInstallParams} from "./executor-base";
import {NodeResolver} from "./node-resolver";
import * as utils from "./utils";

export class CasperSignerExecutor extends CasperExecutor {

  constructor(
    resolver: NodeResolver
  ) {
    super(resolver);
  }

  public async getPublicKey(): Promise<CLPublicKey> {
    const key = await Signer.getActivePublicKey();
    return new Promise(r => r(CLPublicKey.fromHex(key)));
  }

  /**
   * Execute a contract call
   * @param params
   */
  public async call(params: IContractCallParams): Promise<string> {
    const client = new CasperClient(this.resolver.getAddress());
    const contractHashAsByteArray = utils.contractHashToByteArray(params.contractHash);
    const publicKey = await Signer.getActivePublicKey();
    const deployData = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(CLPublicKey.fromHex(publicKey), this.resolver.chain, 1, params.ttl),
      DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        contractHashAsByteArray,
        params.entryPoint,
        params.runtimeArgs
      ),
      DeployUtil.standardPayment(params.paymentAmount)
    );

    // Sign deploy.
    const target = params.recipient ? params.recipient : publicKey;
    const deploy = await Signer.sign(client.deployToJson(deployData), publicKey, target);
    const signedDeploy = client.deployFromJson(deploy);
    if (signedDeploy.ok) {
      return await client.putDeploy(signedDeploy.unwrap())
    }
    throw Error("Failed to sign the contract call!");
  }

  /**
   * Install the given contract
   * @param params
   */
  public async install(params: IInstallParams): Promise<string> {
    const client = new CasperClient(this.resolver.getAddress());
    const publicKey = await Signer.getActivePublicKey();
    // Set contract installation deploy (unsigned).
    const deployData = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(
        CLPublicKey.fromHex(publicKey),
        this.resolver.chain
      ),
      DeployUtil.ExecutableDeployItem.newModuleBytes(
        utils.getBinary(params.pathToContract),
        params.runtimeArgs
      ),
      DeployUtil.standardPayment(params.paymentAmount)
    );

    // Sign deploy.
    const deploy = await Signer.sign(client.deployToJson(deployData), publicKey, publicKey);
    const signedDeploy = client.deployFromJson(deploy);
    if (signedDeploy.ok) {
      return await client.putDeploy(signedDeploy.unwrap())
    }
    throw Error("Failed to sign the contract call!");
  }
}