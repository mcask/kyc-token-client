import {CLMap, CLPublicKey, CLTypeBuilder, CLValue, CLValueBuilder} from "casper-js-sdk";
import {DEFAULT_TTL} from "./constants";

export enum State {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
  FROZEN = "FROZEN",
}

export class GatewayToken {

  public static of(account: CLPublicKey, tokenId: string, meta: Map<string, string>): GatewayToken {
    const expiry = meta.get('expiry') ?? GatewayToken.getDefaultExpireTime().toString();

    return new GatewayToken(
      CLPublicKey.fromHex(meta.get('issuer')!),
      meta.get('network')!,
      tokenId,
      account,
      meta.get('state')! as State,
      expiry,
    )
  }

  public static getDefaultExpireTime(): number {
    const now = Math.floor(Date.now() / 1000);
    return now + DEFAULT_TTL;
  }

  constructor(
    // TODO: Check with Civic/Casper whether this information is in the metadata of the KYC Token NFT
    //  the key used to reference the issuing gatekeeper
    // Account of the Gatekeeper that is issuing the KYC Tokens
    readonly issuingGatekeeper: CLPublicKey,
    // Contract hash of the KYC Token <-- hardcode based on deployment in whichever network(test/main)
    readonly gatekeeperNetwork: string,
    readonly tokenId: string,
    readonly account: CLPublicKey,
    readonly state: State,
    readonly expiryTime: string
  ) {
  }

  public isValid(): boolean {
    return this.state === State.ACTIVE && !this.hasExpired();
  }

  public hasExpired(): boolean {
    const now = Math.floor(Date.now() / 1000);
    return !!this.expiryTime && now > parseInt(this.expiryTime);
  }

  public toClMap(): CLMap<CLValue, CLValue> {
    const clMap = CLValueBuilder.map([
      CLTypeBuilder.string(),
      CLTypeBuilder.string(),
    ]);
    clMap.set(CLValueBuilder.string("issuer"), CLValueBuilder.string(this.issuingGatekeeper.toHex()));
    clMap.set(CLValueBuilder.string("network"), CLValueBuilder.string(this.gatekeeperNetwork));
    clMap.set(CLValueBuilder.string("state"), CLValueBuilder.string(this.state));
    clMap.set(CLValueBuilder.string("expiry"), CLValueBuilder.string(this.expiryTime));
    return clMap;
  }

  /**
   * New token with just the state mutated
   * @param state
   */
  public withState(state: State): GatewayToken {
    return new GatewayToken(
      this.issuingGatekeeper,
      this.gatekeeperNetwork,
      this.tokenId,
      this.account,
      state,
      this.expiryTime,
    )
  }

  /**
   * New token with just the expiry mutated
   * @param expiryTime
   */
  public withExpiry(expiryTime: number): GatewayToken {
    return new GatewayToken(
      this.issuingGatekeeper,
      this.gatekeeperNetwork,
      this.tokenId,
      this.account,
      this.state,
      expiryTime.toString(),
    )
  }
}