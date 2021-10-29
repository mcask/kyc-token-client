"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractHashToByteArray = exports.contractDictionaryGetter = exports.getContractData = exports.getAccountNamedKeyValue = exports.getAccountInfo2 = exports.getStateRootHash = exports.getBinary = exports.getKeyPairOfContract = exports.createRecipientAddress = exports.camelCased = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
const fs_1 = __importDefault(require("fs"));
exports.camelCased = (myString) => myString.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
exports.createRecipientAddress = (recipient) => {
    return new casper_js_sdk_1.CLKey(new casper_js_sdk_1.CLAccountHash(recipient.toAccountHash()));
};
/**
 * Returns an ECC key pair mapped to an NCTL faucet account.
 * @param pathToFaucet - Path to NCTL faucet directory.
 */
exports.getKeyPairOfContract = (pathToFaucet) => casper_js_sdk_1.Keys.Ed25519.parseKeyFiles(`${pathToFaucet}/public_key.pem`, `${pathToFaucet}/secret_key.pem`);
/**
 * Returns a binary as u8 array.
 * @param pathToBinary - Path to binary file to be loaded into memory.
 * @return Uint8Array Byte array.
 */
exports.getBinary = (pathToBinary) => {
    return new Uint8Array(fs_1.default.readFileSync(pathToBinary, null).buffer);
};
/**
 * Returns global state root hash at current block.
 * @param {String} nodeAddress - JS SDK client for interacting with a node.
 * @return {String} Root hash of global state at most recent block.
 */
exports.getStateRootHash = async (nodeAddress) => {
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    const { block } = await client.getLatestBlockInfo();
    if (block) {
        return block.header.state_root_hash;
    }
    else {
        throw Error("Problem when calling getLatestBlockInfo");
    }
};
exports.getAccountInfo2 = async (nodeAddress, publicKey) => {
    const stateRootHash = await exports.getStateRootHash(nodeAddress);
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    const accountHash = publicKey.toAccountHashStr();
    const blockState = await client.getBlockState(stateRootHash, accountHash, []);
    return blockState.Account;
};
/**
 * Returns a value under an on-chain account's storage.
 * @param accountInfo - On-chain account's info.
 * @param namedKey - A named key associated with an on-chain account.
 */
exports.getAccountNamedKeyValue = (accountInfo, namedKey) => {
    const found = accountInfo.namedKeys.find((i) => i.name === namedKey);
    if (found) {
        return found.key;
    }
    return undefined;
};
exports.getContractData = async (nodeAddress, stateRootHash, contractHash, path = []) => {
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    return await client.getBlockState(stateRootHash, `hash-${contractHash}`, path);
};
exports.contractDictionaryGetter = async (nodeAddress, dictionaryItemKey, seedUref) => {
    const stateRootHash = await exports.getStateRootHash(nodeAddress);
    const client = new casper_js_sdk_1.CasperServiceByJsonRPC(nodeAddress);
    const storedValue = await client.getDictionaryItemByURef(stateRootHash, dictionaryItemKey, seedUref);
    if (storedValue && storedValue.CLValue instanceof casper_js_sdk_1.CLValue) {
        return storedValue.CLValue;
    }
    else {
        throw Error("Invalid stored value");
    }
};
exports.contractHashToByteArray = (contractHash) => Uint8Array.from(Buffer.from(contractHash, "hex"));
//# sourceMappingURL=utils.js.map