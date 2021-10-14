// ./casper-client put-deploy --chain-name 'casper-net-1' --node-address 'http://localhost:11101/rpc' --secret-key '/home/star/Desktop/casper/casper-node/utils/nctl/assets/net-1/faucet/secret_key.pem' --payment-amount 2500000000 --session-path '/home/star/Desktop/casper_dev/civic-contract/target/wasm32-unknown-unknown/release/civic-token.wasm' --session-arg "name:string='CIVIC_TOKEN'" --session-arg "symbol:string='CVC'" --session-arg "meta:string=''" --session-arg "admin:key='account-hash-f760757c6fedeac6a2a39efad5c9b133bb3b9f03f18b8fac07441577f8a36bad'" --session-arg "contract_name:string='CivicKycToken'"

// ./casper-client get-deploy '4c09411a1fe68120a533fa2a65386a1c6d3fa66dc7d11dcf52178d6dd2c66d96' --node-address http://localhost:11101/rpc

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

const MASTER_KEY_PAIR_PATH = '/home/star/Desktop/casper/casper-node/utils/nctl/assets/net-1/faucet/';
const NODE_ADDRESS = 'http://localhost:11101/rpc';
const TOKEN_NAME = 'CIVIC_TOKEN';

const KEYS = Keys.Ed25519.parseKeyFiles(
  `${MASTER_KEY_PAIR_PATH}/public_key.pem`,
  `${MASTER_KEY_PAIR_PATH}/secret_key.pem`
);

const test = async () => {
  const installDeployHash = 'a732eae4c74f1e56c049c9238250bea8eb132a78ce393d50a80aae257f4c0f9a';

  await getDeploy(NODE_ADDRESS!, installDeployHash);

  console.log(`... Contract installed successfully.`);

  let accountInfo = await getAccountInfo(NODE_ADDRESS!, KEYS.publicKey);

  console.log(`... Account Info: `);
  console.log(JSON.stringify(accountInfo, null, 2));

  const contractHash = await getAccountNamedKeyValue(
    accountInfo,
    `${TOKEN_NAME!}_contract`
  );

  console.log(`... Contract Hash: ${contractHash}`);
};

test();
