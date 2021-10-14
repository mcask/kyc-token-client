// ./casper-client put-deploy --chain-name 'casper-net-1' --node-address 'http://localhost:11101/rpc' --secret-key '/home/star/Desktop/casper/casper-node/utils/nctl/assets/net-1/faucet/secret_key.pem' --payment-amount 200000000000 --session-path '/home/star/Desktop/casper_dev/civic-contract/target/wasm32-unknown-unknown/release/civic-token.wasm' --session-arg "name:string='CIVIC_TOKEN'" --session-arg "symbol:string='CVC'" --session-arg "meta:string=''" --session-arg "admin:key='account-hash-f760757c6fedeac6a2a39efad5c9b133bb3b9f03f18b8fac07441577f8a36bad'" --session-arg "contract_name:string='CivicKycToken'"

// ./casper-client get-deploy 'a0b0a9eac10ddad2541ae49f9695b6aa905e0467efc0ac6aff665338f2005961' --node-address http://localhost:11101/rpc

import { config } from "dotenv";
config();
import { getDeploy } from "./utils";
import { getAccountInfo, getAccountNamedKeyValue } from "../src/utils";

import {
  CLValueBuilder,
  Keys,
  CLPublicKey,
  CLPublicKeyType,
} from "casper-js-sdk";

const MASTER_KEY_PAIR_PATH = '/home/star/Desktop/casper/casper-node/utils/nctl/assets/net-1/faucet';
const NODE_ADDRESS = 'http://localhost:11101/rpc';
const TOKEN_NAME = 'CivicKycToken';

const KEYS = Keys.Ed25519.parseKeyFiles(
  `${MASTER_KEY_PAIR_PATH}/public_key.pem`,
  `${MASTER_KEY_PAIR_PATH}/secret_key.pem`
);

const test = async () => {
  const installDeployHash = '4052440507ff2c367c19ebfea6aa1692a4aaa0989aabddff508e48438f550590';

  await getDeploy(NODE_ADDRESS!, installDeployHash);

  console.log(`... Contract installed successfully.`);

  let accountInfo = await getAccountInfo(NODE_ADDRESS!, KEYS.publicKey);

  console.log(`... Account Info: `);
  console.log(JSON.stringify(accountInfo, null, 2));

  const contractHash = await getAccountNamedKeyValue(
    accountInfo,
    `${TOKEN_NAME!}_contract_hash`
  );

  console.log(`... Contract Hash: ${contractHash}`);
};

test();
