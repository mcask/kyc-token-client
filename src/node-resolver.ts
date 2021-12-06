export class NodeResolver {
  private index = 0;

  constructor(
    private nodeAddress: string[],
    readonly chain: string
  ) {
  }

  public getAddress(): string {
    const i = this.index;
    this.index += 1;
    if (this.index >= this.nodeAddress.length) {
      this.index = 0;
    }
    return this.nodeAddress[this.index];
  }
}