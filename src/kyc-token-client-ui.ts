import {concat} from '@ethersproject/bytes';
import { blake2b } from '@noble/hashes/blake2b';
import {
  CasperClient,
  CLPublicKey,
  CLValue,
  CLValueBuilder,
  CLValueParsers,
  DeployUtil,
} from "casper-js-sdk";
import {GatewayToken} from "./gateway-token";
import * as utils from "./utils";
import { contractSimpleGetter } from './utils';

export class KycTokenUIClient {
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
   */
  constructor(
    private nodeAddress: string,
    private chainName: string,
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
    const result = await contractSimpleGetter(
      this.nodeAddress,
      this.contractHash,
      ["is_paused"]
    );
    return result.value();
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

  private async getKYCToken(account: CLPublicKey): Promise<string | undefined> {
    const accountKey = utils.createRecipientAddress(account);
    const accountBytes = CLValueParsers.toBytes(accountKey).unwrap();
    const balanceOri = await this.balanceOf(account);
    const balance = parseInt(balanceOri, 10);

    if (balance !== 0) {
      const numBytes = CLValueParsers.toBytes(CLValueBuilder.u256(0)).unwrap();
      const concated = concat([accountBytes, numBytes]);
      // const blaked = blake.blake2b(concated, undefined, 32)
      const blaked =  blake2b(concated, {
        dkLen: 32
      });      const str = Buffer.from(blaked).toString("hex");
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
}


