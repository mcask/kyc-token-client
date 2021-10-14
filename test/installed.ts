import {
  CLValueBuilder,
  Keys,
  CLPublicKey,
  CLAccountHash,
  CLPublicKeyType,
} from "casper-js-sdk";
import { KycTokenClient } from '../src';
import { getDeploy } from "./utils";
import { getAccountInfo, getAccountNamedKeyValue } from "../src/utils";

const MASTER_KEY_PAIR_PATH = '/home/star/Desktop/casper/casper-node/utils/nctl/assets/net-1/faucet';
const NODE_ADDRESS = 'http://localhost:11101/rpc';
const TOKEN_NAME = 'CivicKycToken';

const KEYS = Keys.Ed25519.parseKeyFiles(
  `${MASTER_KEY_PAIR_PATH}/public_key.pem`,
  `${MASTER_KEY_PAIR_PATH}/secret_key.pem`
);

const test = async () => {
    console.log('Testing kyc token client');

    const installDeployHash = '4052440507ff2c367c19ebfea6aa1692a4aaa0989aabddff508e48438f550590';

    await getDeploy(NODE_ADDRESS!, installDeployHash);

    console.log(`... Contract installed successfully.`);

    let accountInfo = await getAccountInfo(NODE_ADDRESS!, KEYS.publicKey);

    // console.log(`... Account Info: `);
    // console.log(JSON.stringify(accountInfo, null, 2));

    const contractHash = await getAccountNamedKeyValue(
      accountInfo,
      `${TOKEN_NAME!}_contract_hash`
    );

    console.log(`... Contract Hash: ${contractHash}`);


    const kycTokenClient = new KycTokenClient('http://localhost:11101/rpc', 'casper-net-1', KEYS);

    // We don't need hash- prefix so i'm removing it
    await kycTokenClient.setContractHash(contractHash.slice(5));

    const name = await kycTokenClient.name();
    console.log("name: ", name);

    const symbol = await kycTokenClient.symbol();
    console.log("symbol: ", symbol);

    const meta = await kycTokenClient.meta();
    console.log("meta: ", meta);

    // const balance = await kycTokenClient.balanceOf(KEYS.publicKey);
    // console.log("balanceOf: ", balance);

    const totalSupply = await kycTokenClient.totalSupply();
    console.log("totalSupply:", totalSupply);
};

test();