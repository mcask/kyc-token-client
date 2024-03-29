import {
  CasperServiceByJsonRPC,
  CLAccountHash,
  CLKey,
  CLPublicKey,
  CLValue,
  Keys,
} from "casper-js-sdk";

export const camelCased = (myString: string) =>
  myString.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

export const createRecipientAddress = (recipient: CLPublicKey): CLKey => {
  return new CLKey(new CLAccountHash(recipient.toAccountHash()));
};

/**
 * Returns an ECC key pair mapped to an NCTL faucet account.
 * @param pathToFaucet - Path to NCTL faucet directory.
 */
export const getKeyPairOfContract = (pathToFaucet: string) =>
  Keys.Ed25519.parseKeyFiles(
    `${pathToFaucet}/public_key.pem`,
    `${pathToFaucet}/secret_key.pem`
  );

/**
 * Returns global state root hash at current block.
 * @param {String} nodeAddress - JS SDK client for interacting with a node.
 * @return {String} Root hash of global state at most recent block.
 */
export const getStateRootHash = async (nodeAddress: string) => {
  const client = new CasperServiceByJsonRPC(nodeAddress);
  const {block} = await client.getLatestBlockInfo();
  if (block) {
    return block.header.state_root_hash;
  } else {
    throw Error("Problem when calling getLatestBlockInfo");
  }
};

export const getAccountInfo2 = async (
  nodeAddress: string,
  publicKey: CLPublicKey
): Promise<any> => {
  const stateRootHash = await getStateRootHash(nodeAddress);
  const client = new CasperServiceByJsonRPC(nodeAddress);
  const accountHash = publicKey.toAccountHashStr();
  const blockState = await client.getBlockState(stateRootHash, accountHash, []);
  return blockState.Account;
};

/**
 * Returns a value under an on-chain account's storage.
 * @param accountInfo - On-chain account's info.
 * @param namedKey - A named key associated with an on-chain account.
 */
export const getAccountNamedKeyValue = (accountInfo: any, namedKey: string) => {
  const found = accountInfo.namedKeys.find((i: any) => i.name === namedKey);
  if (found) {
    return found.key;
  }
  return undefined;
};

export const getContractData = async (
  nodeAddress: string,
  stateRootHash: string,
  contractHash: string,
  path: string[] = []
) => {
  const client = new CasperServiceByJsonRPC(nodeAddress);
  return await client.getBlockState(
    stateRootHash,
    `hash-${contractHash}`,
    path
  );
};

export const contractDictionaryGetter = async (
  nodeAddress: string,
  dictionaryItemKey: string,
  seedUref: string,
) => {
  const stateRootHash = await getStateRootHash(nodeAddress);

  const client = new CasperServiceByJsonRPC(nodeAddress);

  const storedValue = await client.getDictionaryItemByURef(
    stateRootHash,
    dictionaryItemKey,
    seedUref
  );

  if (storedValue && storedValue.CLValue instanceof CLValue) {
    return storedValue.CLValue!;
  } else {
    throw Error("Invalid stored value");
  }
};

export const contractHashToByteArray = (contractHash: string) =>
  Uint8Array.from(Buffer.from(contractHash, "hex"));

export const contractSimpleGetter = async (
    nodeAddress: string,
    contractHash: string,
    key: string[]
) => {
  const stateRootHash = await getStateRootHash(nodeAddress);
  const clValue = await getContractData(
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
