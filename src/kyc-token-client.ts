import {
  CasperClient,
  CLPublicKey,
  CLAccountHash,
  CLString,
  CLTypeBuilder,
  CLValue,
  CLValueBuilder,
  CLValueParsers,
  CLMap,
  DeployUtil,
  EventName,
  EventStream,
  Keys,
  RuntimeArgs,
} from "casper-js-sdk";
import { None } from "ts-results";
import {
  BURN_PAYMENT_AMOUNT,
  CEP47Events,
  DEFAULT_TTL,
  MINT_PAYMENT_AMOUNT,
  UPDATE_PAYMENT_AMOUNT
} from "./constants";
import {GatewayToken} from "./gateway-token";
import * as utils from "./utils";
import { IPendingDeploy, RecipientType } from "./types";

import { concat } from '@ethersproject/bytes';
import blake from "blakejs";

export class KycTokenClient {
  private contractHash: string;
  private contractPackageHash: string;
  private namedKeys: {
    balances: string;
    metadata: string;
    // ownedTokens: string;
    ownedTokensByIndex: string;
    owners: string;
    issuers: string;
    paused: string;
  };
  private isListening = false;
  private pendingDeploys: IPendingDeploy[] = [];

  constructor(
    private nodeAddress: string,
    private chainName: string,
    private masterKey: Keys.AsymmetricKey,
    private eventStreamAddress?: string
  ) {}


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

  public async getGatewayToken(account: CLPublicKey): Promise<GatewayToken> {
    const tokensOf = await this.getTokensOf(account);
    const tokenOneId = tokensOf[0];

    const result = await utils.contractDictionaryGetter(
      this.nodeAddress,
      tokenOneId,
      this.namedKeys.metadata
    );
    const maybeValue = result.value().unwrap();
    const map: Array<[CLValue, CLValue]> = maybeValue.value();

    const jsMap = new Map<string, string>();

    for (const [innerKey, value] of map) {
      jsMap.set(innerKey.value(), value.value());
    }

    return GatewayToken.of(jsMap);
  }

  // TODO: Error: state query failed: ValueNotFound
  public async isPaused() {
    const result = await contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["is_paused"]
    );
    return result.value();
  }

  public async getTokensOf(account: CLPublicKey) {
    const accountKey = utils.createRecipientAddress(account);
    const accountBytes = CLValueParsers.toBytes(accountKey).unwrap();
    const balanceOri = await this.balanceOf(account);
    const balance = parseInt(balanceOri, 10);

    let tokenIds: string[] = [];

    for (let i = 0; i < balance; i++) {
      const numBytes = CLValueParsers.toBytes(CLValueBuilder.u256(i)).unwrap();
      const concated = concat([accountBytes, numBytes]);
      const blaked = blake.blake2b(concated, undefined, 32)
      const str = Buffer.from(blaked).toString("hex");
      const result = await utils.contractDictionaryGetter(
        this.nodeAddress,
        str,
        this.namedKeys.ownedTokensByIndex
      );
      const maybeValue = result.value().unwrap();
      tokenIds = [...tokenIds, maybeValue.value()];
    }

    return tokenIds;
  }

  /**
   * Issue a KYC Token to the given account
   * @param account
   * @param meta
   * @param paymentAmount
   * @param ttl
   */
  public async issue(
    account: RecipientType,
    meta: Map<string, string>,
    paymentAmount = MINT_PAYMENT_AMOUNT,
    ttl = DEFAULT_TTL
  ) : Promise<DeployUtil.Deploy> {
    const tokenId = CLValueBuilder.option(None, CLTypeBuilder.string());
    const runtimeArgs = RuntimeArgs.fromMap({
      recipient: utils.createRecipientAddress(account),
      token_id: tokenId,
      token_meta: toCLMap(meta),
    });

    const deployHash = await contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "mint_one",
      paymentAmount,
      nodeAddress: this.nodeAddress,
      keys: this.masterKey,
      runtimeArgs,
      ttl
    });

    if (deployHash !== null) {
      this.addPendingDeploy(CEP47Events.MintOne, deployHash);
      return this.confirmDeploy(deployHash);
    } else {
      throw Error("Invalid Deploy");
    }
  }


   async updateTokenMetadata(
    tokenId: string,
    meta: Map<string, string>,
    paymentAmount: string,
    ttl = DEFAULT_TTL
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      token_id: CLValueBuilder.string(tokenId),
      token_meta: toCLMap(meta),
    });

    const deployHash = await contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "update_token_metadata",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });

    if (deployHash !== null) {
      this.addPendingDeploy(CEP47Events.MetadataUpdate, deployHash);
      return deployHash;
    } else {
      throw Error("Invalid Deploy");
    }
  }

   async burnOne(
    account: RecipientType,
    tokenId: string,
    paymentAmount: string,
    ttl = DEFAULT_TTL
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({
      owner: utils.createRecipientAddress(account),
      token_id: CLValueBuilder.string(tokenId),
    });

    const deployHash = await contractCall({
      chainName: this.chainName,
      contractHash: this.contractHash,
      entryPoint: "burn_one",
      keys: this.masterKey,
      nodeAddress: this.nodeAddress,
      paymentAmount,
      runtimeArgs,
      ttl
    });

    if (deployHash !== null) {
      this.addPendingDeploy(CEP47Events.BurnOne, deployHash);
      return deployHash;
    } else {
      throw Error("Invalid Deploy");
    }
  }

  /**
   * Revoke the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  public async revoke(
      account: CLPublicKey,
      paymentAmount = BURN_PAYMENT_AMOUNT,
): Promise<DeployUtil.Deploy> {
    // Call "revoke"
    const tokensOf = await this.getTokensOf(account);
    const tokenOneId = tokensOf[0];

    const burnTokenOneDeployHash = await this.burnOne(
        new CLAccountHash(account.toAccountHash()),
        tokenOneId,
        paymentAmount
    );
    console.log(
        "... Revoke deploy hash: ",
        burnTokenOneDeployHash
    );
    return this.confirmDeploy(burnTokenOneDeployHash);
}

  /**
   * Freeze the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  public async freeze(account: CLPublicKey,
                      paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<DeployUtil.Deploy> {
    const tokensOf = await this.getTokensOf(account);
    const tokenOneId = tokensOf[0];
    const newTokenOneMetadata = new Map([
      ["status", 'Frozen'],
    ]);
    const updatedTokenMetaDeployHash = await this.updateTokenMetadata(
        tokenOneId,
        newTokenOneMetadata,
        paymentAmount
    );
    console.log(
        "... freeze deploy hash: ",
        updatedTokenMetaDeployHash
    );
    return this.confirmDeploy(updatedTokenMetaDeployHash);
  }

  /**
   * Unfreeze the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  public async unfreeze(account: CLPublicKey,
                        paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<DeployUtil.Deploy> {
    // Call "unfreeze"
    const tokensOf = await this.getTokensOf(account);
    const tokenOneId = tokensOf[0];
    const newTokenOneMetadata = new Map([
      ["status", 'UnFrozen'],
    ]);
    const updatedTokenMetaDeployHash = await this.updateTokenMetadata(
        tokenOneId,
        newTokenOneMetadata,
        paymentAmount
    );
    console.log(
        "... unfreeze deploy hash: ",
        updatedTokenMetaDeployHash
    );
    return this.confirmDeploy(updatedTokenMetaDeployHash);
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
): Promise<DeployUtil.Deploy> {
  // Call updateExpiry on token
  const tokensOf = await this.getTokensOf(account);
  const tokenOneId = tokensOf[0];
  // TODO: Confirm with Casper/Civic what this looks like
  const newTokenOneMetadata = new Map([
    ["expiry", expireTime.toString()],
  ]);
  const updatedTokenMetaDeployHash = await this.updateTokenMetadata(
      tokenOneId,
      newTokenOneMetadata,
      paymentAmount
  );
  console.log(
      "... update expiry deploy hash: ",
      updatedTokenMetaDeployHash
  );
  return this.confirmDeploy(updatedTokenMetaDeployHash);
}

  async sleep(ms: number) : Promise<unknown>{
    return new Promise(resolve => setTimeout(resolve, ms));
  }

   async confirmDeploy(deployHash: string) : Promise<DeployUtil.Deploy> {
    const client = new CasperClient(this.nodeAddress);
    let i = 300;
    while (i !== 0) {
      const [deploy, raw] = await client.getDeploy(deployHash);
      if (raw.execution_results.length !== 0){
        // @ts-ignore
        if (raw.execution_results[0].result.Success) {
          return deploy;
        } else {
          // @ts-ignore
          throw Error("Contract execution: " + raw.execution_results[0].result.Failure.error_message);
        }
      } else {
        i--;
        await this.sleep(1000);
        continue;
      }
    }
    throw Error('Timeout after ' + i + 's. Something\'s wrong');
  }

  public onEvent(
    eventNames: CEP47Events[],
    callback: (
      eventName: CEP47Events,
      deployStatus: {
        deployHash: string;
        success: boolean;
        error: string | null;
      },
      result: any | null
    ) => void
  ): any {
    if (!this.eventStreamAddress) {
      throw Error("Please set eventStreamAddress before!");
    }
    if (this.isListening) {
      throw Error(
        "Only one event listener can be create at a time. Remove the previous one and start new."
      );
    }
    const es = new EventStream(this.eventStreamAddress);
    this.isListening = true;

    es.subscribe(EventName.DeployProcessed, (value: any) => {
      const deployHash = value.body.DeployProcessed.deploy_hash;

      const pendingDeploy = this.pendingDeploys.find(
        (pending) => pending.deployHash === deployHash
      );

      if (!pendingDeploy) {
        return;
      }

      if (
        !value.body.DeployProcessed.execution_result.Success &&
        value.body.DeployProcessed.execution_result.Failure
      ) {
        callback(
          pendingDeploy.deployType,
          {
            deployHash,
            error:
              value.body.DeployProcessed.execution_result.Failure.error_message,
            success: false,
          },
          null
        );
      } else {
        const { transforms } =
          value.body.DeployProcessed.execution_result.Success.effect;

        const cep47Events = transforms.reduce((acc: any, val: any) => {
          if (
            val.transform.hasOwnProperty("WriteCLValue") &&
            typeof val.transform.WriteCLValue.parsed === "object" &&
            val.transform.WriteCLValue.parsed !== null
          ) {
            const maybeCLValue = CLValueParsers.fromJSON(
              val.transform.WriteCLValue
            );
            const clValue = maybeCLValue.unwrap();
            if (clValue && clValue instanceof CLMap) {
              const hash = clValue.get(
                CLValueBuilder.string("contract_package_hash")
              );
              const event = clValue.get(CLValueBuilder.string("event_type"));
              if (
                hash &&
                hash.value() === this.contractPackageHash &&
                event &&
                eventNames.includes(event.value())
              ) {
                acc = [...acc, { name: event.value(), clValue }];
              }
            }
          }
          return acc;
        }, []);

        cep47Events.forEach((d: any) =>
          callback(
            d.name,
            { deployHash, error: null, success: true },
            d.clValue
          )
        );
      }

      this.pendingDeploys = this.pendingDeploys.filter(
        (pending) => pending.deployHash !== deployHash
      );
    });
    es.start();

    return {
      stopListening: () => {
        es.unsubscribe(EventName.DeployProcessed);
        es.stop();
        this.isListening = false;
        this.pendingDeploys = [];
      },
    };
  }

  private addPendingDeploy(deployType: CEP47Events, deployHash: string) {
    this.pendingDeploys = [...this.pendingDeploys, { deployHash, deployType }];
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
  const deployHash = await client.putDeploy(deploy);

  return deployHash;
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

const toCLMap = (map: Map<string, string>) => {
  const clMap = CLValueBuilder.map([
    CLTypeBuilder.string(),
    CLTypeBuilder.string(),
  ]);
  for (const [key, value] of Array.from(map.entries())) {
    clMap.set(CLValueBuilder.string(key), CLValueBuilder.string(value));
  }
  return clMap;
};

const fromCLMap = (map: Map<CLString, CLString>) => {
  const jsMap = new Map();
  for (const [key, value] of Array.from(map.entries())) {
    jsMap.set(key.value(), value.value());
  }
  return jsMap;
};
