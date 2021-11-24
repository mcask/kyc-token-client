import {concat} from '@ethersproject/bytes';
import blake from "blakejs";
import {
  CasperClient, CLMap,
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
  UPDATE_PAYMENT_AMOUNT, WHITELIST_PAYMENT_AMOUNT
} from "./constants";
import {GatewayToken, State} from "./gateway-token";
import * as utils from "./utils";

export class KycTokenClient {
  private contractHash!: string;
  private contractPackageHash!: string;
  private namedKeys!: {
    admins: string;
    allowances: string;
    balances: string;
    gatekeepers: string;
    metadata: string;
    ownedIndexesByToken: string;
    ownedTokensByIndex: string;
    owners: string;
    issuers: string;
    paused: string;
  };

  /**
   * Construct the KYC Token Client
   * @param nodeAddress
   * @param chainName
   * @param masterKey - keypair which is allowed to make changes to the KYC Token
   */
  constructor(
    private nodeAddress: string,
    private chainName: string,
    private masterKey: Keys.AsymmetricKey
  ) {
  }

  public async setContractHash(hash: string) {
    const stateRootHash = await utils.getStateRootHash(this.nodeAddress);
    const contractData = await utils.getContractData(
      this.nodeAddress,
      stateRootHash,
      hash
    );

    const { contractPackageHash, namedKeys } = contractData.Contract!;

    this.contractHash = hash;
    this.contractPackageHash = contractPackageHash.replace(
      "contract-package-wasm",
      ""
    );
    const LIST_OF_NAMED_KEYS = [
      "admins",
      "allowances",
      "balances",
      "gatekeepers",
      "metadata",
      "owned_indexes_by_token",
      "owned_tokens_by_index",
      "owners",
      "issuers",
      "paused",
    ];
    // @ts-ignore
    this.namedKeys = namedKeys.reduce((acc, val) => {
      if (LIST_OF_NAMED_KEYS.includes(val.name)) {
        return { ...acc, [utils.camelCased(val.name)]: val.key };
      }
      return acc;
    }, {});
  }

  public async name() {
    const result = await utils.contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["name"]
    );
    return result.value();
  }

  public async symbol() {
    const result = await utils.contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["symbol"]
    );
    return result.value();
  }

  public async meta() {
    const result = await utils.contractSimpleGetter(
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
    const maybeValue = result?.value().unwrap();
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
    const result = await utils.contractSimpleGetter(
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

    if (!kycToken) {
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
    const result = await utils.contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["is_paused"]
    );
    return result.value();
  }

  /**
   * This is a contract level function, where we request a new admin to be whitelisted
   * @param account
   * @param paymentAmount
   * @param ttl
   */
  public async addAdmin(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    // New minter to add
    const runtimeArgs = RuntimeArgs.fromMap({
      admin: utils.createRecipientAddress(account),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "grant_admin",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  /**
   * This is a contract level function, where we request an admin to be removed
   * @param account
   * @param paymentAmount
   * @param ttl
   */
  public async revokeAdmin(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    // New minter to add
    const runtimeArgs = RuntimeArgs.fromMap({
      admin: utils.createRecipientAddress(account),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "revoke_admin",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  /**
   * This is a contract level function, where we request a new gatekeeper to be whitelisted
   * @param account
   * @param paymentAmount
   * @param ttl
   */
  public async addGatekeeper(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    // New minter to add
    const runtimeArgs = RuntimeArgs.fromMap({
      gatekeeper: utils.createRecipientAddress(account),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "grant_gatekeeper",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  /**
   * This is a contract level function, where we request a gatekeeper to be removed
   * @param account
   * @param paymentAmount
   * @param ttl
   */
  public async revokeGatekeeper(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    // New minter to add
    const runtimeArgs = RuntimeArgs.fromMap({
      gatekeeper: utils.createRecipientAddress(account),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "revoke_gatekeeper",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  /**
   * Issue a KYC Token to the given account
   * @param account
   * @param token
   * @param paymentAmount
   * @param ttl
   */
  public async issue(
    token: GatewayToken,
    paymentAmount = MINT_PAYMENT_AMOUNT,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    // By default no token id here!
    const tokenId = CLValueBuilder.option(None, CLTypeBuilder.string());
    const runtimeArgs = RuntimeArgs.fromMap({
      recipient: utils.createRecipientAddress(token.account),
      token_id: tokenId,
      token_meta: token.toClMap(),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "mint",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  /**
   * Update the state of the KYC Token in the given account
   * @param account
   * @param state
   * @param paymentAmount
   */
  async updateState(
    account: CLPublicKey,
    state: State,
    paymentAmount: string,
  ): Promise<string> {
    const kycToken = await this.getGatewayToken(account);
    if (!kycToken) {
      throw Error(`KYC Token not found for account: ${account.toHex()}`);
    }

    return this.updateTokenMetadata(
      kycToken,
      CLValueBuilder.string("status"),
      CLValueBuilder.string(state),
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
    expireTime?: string,
    paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    const kycToken = await this.getGatewayToken(account);
    if (!kycToken) {
      throw Error(`KYC Token not found for account: ${account.toHex()}`);
    }
    // Check what we need to do here
    if (expireTime) {
      return this.updateTokenMetadata(
        kycToken,
        CLValueBuilder.string("expiry"),
        CLValueBuilder.string(expireTime),
        paymentAmount
      )
    }
    // Expiry time removed, so reset the state completely
    return this.setTokenMetadata(
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

  public async getKYCToken(account: CLPublicKey): Promise<string | undefined> {
    const accountKey = utils.createRecipientAddress(account);
    const accountBytes = CLValueParsers.toBytes(accountKey).unwrap();
    const balanceOri = await this.balanceOf(account);
    const balance = parseInt(balanceOri, 10);

    if (balance !== 0) {
      const numBytes = CLValueParsers.toBytes(CLValueBuilder.u256(0)).unwrap();
      const concated = concat([accountBytes, numBytes]);
      const blaked = blake.blake2b(concated, undefined, 32)
      const str = Buffer.from(blaked).toString("hex");
      const result = await utils.contractDictionaryGetter(
        this.nodeAddress,
        str,
        this.namedKeys.ownedTokensByIndex
      );
      const maybeValue = result.value().unwrap();
      return new Promise((resolve) => resolve(maybeValue.value()));
    }

    return new Promise((resolve) => resolve(undefined));
  }

  /**
   * The set function updates the entire metadata object
   * @param token
   * @param paymentAmount
   * @param ttl
   */
  private async setTokenMetadata(
    token: GatewayToken,
    paymentAmount: string,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    if (!token.tokenId) {
      throw Error("Cannot set KYC Token Metadata with no id!");
    }
    const runtimeArgs = RuntimeArgs.fromMap({
      token_id: CLValueBuilder.string(token.tokenId),
      token_meta: token.toClMap(),
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "set_token_meta",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
  }

  /**
   * The update fundtion only needs the metadata that needs to change per Casper
   * @param token
   * @param metaKey
   * @param metaValue
   * @param paymentAmount
   * @param ttl
   */
  public async updateTokenMetadata(
    token: GatewayToken,
    metaKey: CLValue,
    metaValue: CLValue,
    paymentAmount: string,
    ttl = DEFAULT_TTL
  ): Promise<string> {
    if (!token.tokenId) {
      throw Error("Cannot update KYC Token Metadata with no id!");
    }
    const runtimeArgs = RuntimeArgs.fromMap({
      token_id: CLValueBuilder.string(token.tokenId),
      token_meta_key: metaKey,
      token_meta_value: metaValue
    });

    return contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "update_token_meta",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });
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
