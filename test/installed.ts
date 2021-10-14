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

    const kycTokenClient = new KycTokenClient('http://localhost:11101/rpc', 'casper-net-1', 'ec3af59f705f661ed1c59ac6c57ddb1a538a0964a2959b7b45914f4fafaa2e22', KEYS);
    const name = await kycTokenClient.name();
    console.log("name: ", name);
};

test();