import {CLMap, CLPublicKey, CLTypeBuilder, CLValue, CLValueBuilder} from "casper-js-sdk";

export enum State {
  ACTIVE = "Active",
  REVOKED = "Revoked",
  FROZEN = "Frozen",
}

export class GatewayToken {

  public static of(account: CLPublicKey, tokenId: string, meta: Map<string, string>): GatewayToken {
    return new GatewayToken(
      CLPublicKey.fromHex(meta.get('issuer')!),
      meta.get('network')!,
      account,
      meta.get('status')! as State,
      meta.get('expiry'),
      tokenId
    )
  }

  constructor(
    // Account of the Gatekeeper that is issuing the KYC Tokens
    readonly issuingGatekeeper: CLPublicKey,
    // Contract hash of the KYC Token <-- hardcode based on deployment in whichever network(test/main)
    readonly gatekeeperNetwork: string,
    readonly account: CLPublicKey,
    readonly status: State,
    readonly expiryTime?: string,
    readonly tokenId?: string,
  ) {
  }

  public isValid(): boolean {
    return this.status === State.ACTIVE && !this.hasExpired();
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
    clMap.set(CLValueBuilder.string("status"), CLValueBuilder.string(this.status));
    if (this.expiryTime) {
      clMap.set(CLValueBuilder.string("expiry"), CLValueBuilder.string(this.expiryTime));
    }
    return clMap;
  }

  /**
   * New token with just the expiry mutated
   * @param expiryTime
   */
  public withExpiry(expiryTime?: string): GatewayToken {
    return new GatewayToken(
      this.issuingGatekeeper,
      this.gatekeeperNetwork,
      this.account,
      this.status,
      expiryTime,
      this.tokenId,
    )
  }
}