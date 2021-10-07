import {
  CasperClient,
  CLPublicKey,
  CLTypeBuilder,
  CLValue,
  CLValueBuilder,
  CLValueParsers,
  DeployUtil,
  Keys,
  RuntimeArgs,
} from "casper-js-sdk";
import {None} from "ts-results";
import {
  DEFAULT_TTL,
  MINT_PAYMENT_AMOUNT,
  UPDATE_PAYMENT_AMOUNT
} from "./constants";
import {GatewayToken, State} from "./gateway-token";
import * as utils from "./utils";
import {concat} from '@ethersproject/bytes';
import blake from "blakejs";

export class KycTokenClient {
  private namedKeys: {
    balances: string;
    metadata: string;
    // ownedTokens: string;
    ownedTokensByIndex: string;
    owners: string;
    issuers: string;
    paused: string;
  };

  /**
   * Construct the KYC Token Client
   * @param nodeAddress
   * @param chainName
   * @param contractHash - this is the deployed address of the KYC Token Contract
   * @param masterKey - keypair which is allowed to make changes to the KYC Token
   */
  constructor(
    private nodeAddress: string,
    private chainName: string,
    private contractHash: string,
    private masterKey: Keys.AsymmetricKey
  ) {
  }


  public async name() {
    const result = await contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["name"]
    );
    return result.value();
  }

  public async symbol() {
    const result = await contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["symbol"]
    );
    return result.value();
  }

  public async meta() {
    const result = await contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["meta"]
    );
    const res: Array<[CLValue, CLValue]> = result.value();

    const jsMap = new Map();

    for (const [innerKey, value] of res) {
      jsMap.set(innerKey.value(), value.value());
    }
    return jsMap;
  }

  public async balanceOf(account: CLPublicKey) {
    const accountHash = Buffer.from(account.toAccountHash()).toString("hex");
    const result = await utils.contractDictionaryGetter(
      this.nodeAddress,
      accountHash,
      this.namedKeys.balances
    );
    const maybeValue = result.value().unwrap();
    return maybeValue.value().toString();
  }

  public async getOwnerOf(tokenId: string) {
    const result = await utils.contractDictionaryGetter(
      this.nodeAddress,
      tokenId,
      this.namedKeys.owners
    );
    const maybeValue = result.value().unwrap();
    return `account-hash-${Buffer.from(maybeValue.value().value()).toString(
      "hex"
    )}`;
  }

  public async getIssuerOf(tokenId: string) {
    const result = await utils.contractDictionaryGetter(
      this.nodeAddress,
      tokenId,
      this.namedKeys.issuers
    );
    const maybeValue = result.value().unwrap();
    return `account-hash-${Buffer.from(maybeValue.value().value()).toString(
      "hex"
    )}`;
  }

  public async totalSupply() {
    const result = await contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["total_supply"]
    );
    return result.value();
  }

  /**
   * Return the KYC Token associated with the given account
   * @param account
   */
  public async getGatewayToken(account: CLPublicKey): Promise<GatewayToken | undefined> {
    const kycToken = await this.getKYCToken(account);

    if (kycToken === undefined) {
      return new Promise((resolve) => resolve(undefined));
    }

    const result = await utils.contractDictionaryGetter(
      this.nodeAddress,
      kycToken,
      this.namedKeys.metadata
    );
    const maybeValue = result.value().unwrap();
    const map: Array<[CLValue, CLValue]> = maybeValue.value();

    const jsMap = new Map<string, string>();

    for (const [innerKey, value] of map) {
      jsMap.set(innerKey.value(), value.value());
    }

    return new Promise((resolve) => resolve(GatewayToken.of(account, kycToken, jsMap)));
  }

  /**
   * Test if the KYC Token contract is paused
   */
  // TODO: Error: state query failed: ValueNotFound
  public async isPaused() {
    const result = await contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["is_paused"]
    );
    return result.value();
  }

  async getKYCToken(account: CLPublicKey): Promise<string | undefined> {
    const accountKey = utils.createRecipientAddress(account);
    const accountBytes = CLValueParsers.toBytes(accountKey).unwrap();
    const balanceOri = await this.balanceOf(account);
    const balance = parseInt(balanceOri, 10);

    for (let i = 0; i < balance; i++) {
      const numBytes = CLValueParsers.toBytes(CLValueBuilder.u256(i)).unwrap();
      const concated = concat([accountBytes, numBytes]);
      const blaked = blake.blake2b(concated, undefined, 32)
      const str = Buffer.from(blaked).toString("hex");
      // Check if the token contract has matches the KYC Token contract hash
      if (str === this.contractHash) {
        const result = await utils.contractDictionaryGetter(
          this.nodeAddress,
          str,
          this.namedKeys.ownedTokensByIndex
        );
        const maybeValue = result.value().unwrap();
        return new Promise((resolve) => resolve(maybeValue.value()));
      }
    }

    return new Promise((resolve) => resolve(undefined));
    ;
  }

  /**
   * Issue a KYC Token to the given account
   * @param account
   * @param token
   * @param paymentAmount
   * @param ttl
   */
  public async issue(
    account: CLPublicKey,
    token: GatewayToken,
    paymentAmount = MINT_PAYMENT_AMOUNT,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    const tokenId = CLValueBuilder.option(None, CLTypeBuilder.string());
    const runtimeArgs = RuntimeArgs.fromMap({
      recipient: utils.createRecipientAddress(account),
      token_id: tokenId,
      token_meta: token.toClMap(),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "mint_one",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  async updateTokenMetadata(
    token: GatewayToken,
    paymentAmount: string,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    const runtimeArgs = RuntimeArgs.fromMap({
      token_id: CLValueBuilder.string(token.tokenId),
      token_meta: token.toClMap(),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "update_token_metadata",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  async updateState(
    account: CLPublicKey,
    state: State,
    paymentAmount: string,
  ): Promise<string> {
    const kycToken = await this.getGatewayToken(account);
    if (kycToken === undefined) {
      throw Error(`KYC Token not found for account: ${account.toHex()}`);
    }
    return this.updateTokenMetadata(
      kycToken.withState(state),
      paymentAmount
    );
  }

  /**
   * Revoke the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  public async revoke(
    account: CLPublicKey,
    paymentAmount = UPDATE_PAYMENT_AMOUNT,
  ): Promise<string> {
    return this.updateState(account, State.REVOKED, paymentAmount);
  }

  /**
   * Freeze the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  public async freeze(account: CLPublicKey,
                      paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    return this.updateState(account, State.FROZEN, paymentAmount);
  }

  /**
   * Unfreeze the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  public async unfreeze(
    account: CLPublicKey,
    paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    return this.updateState(account, State.ACTIVE, paymentAmount);
  }

  /**
   * Update the expiry of the KYC Token belonging to this account
   * @param account
   * @param expireTime
   * @param paymentAmount
   */
  public async updateExpiry(
    account: CLPublicKey,
    expireTime: number,
    paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    const kycToken = await this.getGatewayToken(account);
    if (kycToken === undefined) {
      throw Error(`KYC Token not found for account: ${account.toHex()}`);
    }
    return this.updateTokenMetadata(
      kycToken.withExpiry(expireTime),
      paymentAmount
    );
  }

  /**
   * Confirm that the given hash has been deployed, poll this till either an exception is thrown indicating error
   * or a valid deployment result is returned
   * @param deployHash
   */
  public async confirmDeploy(deployHash: string): Promise<DeployUtil.Deploy | undefined> {
    const client = new CasperClient(this.nodeAddress);
    const [deploy, raw] = await client.getDeploy(deployHash);
    if (raw.execution_results.length !== 0) {
      // @ts-ignore
      if (raw.execution_results[0].result.Success) {
        return new Promise((resolve) => resolve(deploy));
      } else {
        // @ts-ignore
        throw Error("Contract execution: " + raw.execution_results[0].result.Failure.error_message);
      }
    }

    return new Promise((resolve) => resolve(undefined));
  }
}


interface IContractCallParams {
  nodeAddress: string;
  keys: Keys.AsymmetricKey;
  chainName: string;
  entryPoint: string;
  runtimeArgs: RuntimeArgs;
  paymentAmount: string;
  contractHash: string;
  ttl: number;
}

const contractCall = async ({
                              nodeAddress,
                              keys,
                              chainName,
                              contractHash,
                              entryPoint,
                              runtimeArgs,
                              paymentAmount,
                              ttl
                            }: IContractCallParams) => {
  const client = new CasperClient(nodeAddress);
  const contractHashAsByteArray = utils.contractHashToByteArray(contractHash);

  let deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(keys.publicKey, chainName, 1, ttl),
    DeployUtil.ExecutableDeployItem.newStoredContractByHash(
      contractHashAsByteArray,
      entryPoint,
      runtimeArgs
    ),
    DeployUtil.standardPayment(paymentAmount)
  );

  // Sign deploy.
  deploy = client.signDeploy(deploy, keys);

  // Dispatch deploy to node.
  return await client.putDeploy(deploy);
};

const contractSimpleGetter = async (
  nodeAddress: string,
  contractHash: string,
  key: string[]
) => {
  const stateRootHash = await utils.getStateRootHash(nodeAddress);
  const clValue = await utils.getContractData(
    nodeAddress,
    stateRootHash,
    contractHash,
    key
  );

  if (clValue && clValue.CLValue instanceof CLValue) {
    return clValue.CLValue!;
  } else {
    throw Error("Invalid stored value");
  }
};
