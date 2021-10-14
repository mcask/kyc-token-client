import { KycTokenClient } from '../src';
import {
    CLValueBuilder,
    Keys,
    CLPublicKey,
    CLAccountHash,
    CLPublicKeyType,
  } from "casper-js-sdk";

const test = async () => {
    console.log('Testing kyc token client');

    const MASTER_KEY_PAIR_PATH = '/home/star/Desktop/casper/casper-node/utils/nctl/assets/net-1/faucet';

    const KEYS = Keys.Ed25519.parseKeyFiles(
        `${MASTER_KEY_PAIR_PATH}/public_key.pem`,
        `${MASTER_KEY_PAIR_PATH}/secret_key.pem`
      );

    const kycTokenClient = new KycTokenClient('http://localhost:11101/rpc', 'casper-net-1', '4c09411a1fe68120a533fa2a65386a1c6d3fa66dc7d11dcf52178d6dd2c66d96', KEYS);
    const name = await kycTokenClient.name();
    console.log("name: ", name);
};

test();