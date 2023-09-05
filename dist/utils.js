"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractHashToByteArray = exports.contractDictionaryGetter = exports.getContractData = exports.getAccountNamedKeyValue = exports.getAccountInfo = exports.getStateRootHash = exports.getBinary = exports.getKeyPairOfContract = exports.createRecipientAddress = exports.camelCased = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
const fs_1 = __importDefault(require("fs"));
const camelCased = (myString) => myString.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
exports.camelCased = camelCased;
const createRecipientAddress = (recipient) => {
    return new casper_js_sdk_1.CLKey(new casper_js_sdk_1.CLAccountHash(recipient.toAccountHash()));
};
exports.createRecipientAddress = createRecipientAddress;
/**
 * Returns an ECC key pair mapped to an NCTL faucet account.
 * @param pathToFaucet - Path to NCTL faucet directory.
 */
const getKeyPairOfContract = (pathToFaucet) => casper_js_sdk_1.Keys.Ed25519.parseKeyFiles(`${pathToFaucet}/public_key.pem`, `${pathToFaucet}/secret_key.pem`);
exports.getKeyPairOfContract = getKeyPairOfContract;
/**
 * Returns a binary as u8 array.
 * @param pathToBinary - Path to binary file to be loaded into memory.
 * @return Uint8Array Byte array.
 */
const getBinary = (pathToBinary) => {
    return new Uint8Array(fs_1.default.readFileSync(pathToBinary, null).buffer);
};
exports.getBinary = getBinary;
/**
 * Returns global state root hash at current block.
 * @param {String} nodeAddress - JS SDK client for interacting with a node.
 * @return {String} Root hash of global state at most recent block.
 */
const getStateRootHash = async (nodeAddress) => {
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    const { block } = await client.getLatestBlockInfo();
    if (block) {
        return block.header.state_root_hash;
    }
    else {
        throw Error("Problem when calling getLatestBlockInfo");
    }
};
exports.getStateRootHash = getStateRootHash;
const getAccountInfo = async (nodeAddress, publicKey) => {
    const stateRootHash = await (0, exports.getStateRootHash)(nodeAddress);
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    const accountHash = publicKey.toAccountHashStr();
    const blockState = await client.getBlockState(stateRootHash, accountHash, []);
    return blockState.Account;
};
exports.getAccountInfo = getAccountInfo;
/**
 * Returns a value under an on-chain account's storage.
 * @param accountInfo - On-chain account's info.
 * @param namedKey - A named key associated with an on-chain account.
 */
const getAccountNamedKeyValue = (accountInfo, namedKey) => {
    const found = accountInfo.namedKeys.find((i) => i.name === namedKey);
    if (found) {
        return found.key;
    }
    return undefined;
};
exports.getAccountNamedKeyValue = getAccountNamedKeyValue;
const getContractData = async (nodeAddress, stateRootHash, contractHash, path = []) => {
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    return await client.getBlockState(stateRootHash, `hash-${contractHash}`, path);
};
exports.getContractData = getContractData;
const contractDictionaryGetter = async (nodeAddress, dictionaryItemKey, seedUref) => {
    const stateRootHash = await (0, exports.getStateRootHash)(nodeAddress);
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    const storedValue = await client.getDictionaryItemByURef(stateRootHash, dictionaryItemKey, seedUref);
    if (storedValue && storedValue.CLValue instanceof casper_js_sdk_1.CLValue) {
        return storedValue.CLValue;
    }
    else {
        throw Error("Invalid stored value");
    }
};
exports.contractDictionaryGetter = contractDictionaryGetter;
const contractHashToByteArray = (contractHash) => Uint8Array.from(Buffer.from(contractHash, "hex"));
exports.contractHashToByteArray = contractHashToByteArray;
//# sourceMappingURL=utils.js.map