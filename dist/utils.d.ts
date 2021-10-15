import { CLKey, CLPublicKey, CLValue, Keys } from "casper-js-sdk";
export declare const camelCased: (myString: string) => string;
export declare const createRecipientAddress: (recipient: CLPublicKey) => CLKey;
/**
 * Returns an ECC key pair mapped to an NCTL faucet account.
 * @param pathToFaucet - Path to NCTL faucet directory.
 */
export declare const getKeyPairOfContract: (pathToFaucet: string) => Keys.AsymmetricKey;
/**
 * Returns a binary as u8 array.
 * @param pathToBinary - Path to binary file to be loaded into memory.
 * @return Uint8Array Byte array.
 */
export declare const getBinary: (pathToBinary: string) => Uint8Array;
/**
 * Returns global state root hash at current block.
 * @param {String} nodeAddress - JS SDK client for interacting with a node.
 * @return {String} Root hash of global state at most recent block.
 */
export declare const getStateRootHash: (nodeAddress: string) => Promise<string>;
export declare const getAccountInfo2: (nodeAddress: string, publicKey: CLPublicKey) => Promise<any>;
/**
 * Returns a value under an on-chain account's storage.
 * @param accountInfo - On-chain account's info.
 * @param namedKey - A named key associated with an on-chain account.
 */
export declare const getAccountNamedKeyValue: (accountInfo: any, namedKey: string) => any;
export declare const getContractData: (nodeAddress: string, stateRootHash: string, contractHash: string, path?: string[]) => Promise<import("casper-js-sdk/dist/lib/StoredValue").StoredValue>;
export declare const contractDictionaryGetter: (nodeAddress: string, dictionaryItemKey: string, seedUref: string) => Promise<CLValue>;
export declare const contractHashToByteArray: (contractHash: string) => Uint8Array;
