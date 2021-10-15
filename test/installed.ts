import {
  CLValueBuilder,
  Keys,
  CLPublicKey,
  CLAccountHash,
  CLPublicKeyType,
} from "casper-js-sdk";
import { KycTokenClient, GatewayToken, State } from '../src';
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

    const installDeployHash = '947894b9c4a4a7526c3427293f39580b7334e2cbc86f53eb05a561ce6ca3f038';

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

    const totalSupply = await kycTokenClient.totalSupply();
    console.log("totalSupply:", totalSupply);

    // const balance = await kycTokenClient.balanceOf(KEYS.publicKey);
    // console.log("balanceOf: ", balance);

    // const isPaused = await kycTokenClient.isPaused();
    // console.log("isPaused:", isPaused);

    const addGatekeeperHash = await kycTokenClient.addGatekeeper(KEYS.publicKey);
    console.log('addGatekeeperHash:', addGatekeeperHash);

    const revokeGatekeeperHash = await kycTokenClient.revokeGatekeeper(KEYS.publicKey);
    console.log('revokeGatekeeperHash:', revokeGatekeeperHash);

    const gatewayToken = new GatewayToken(KEYS.publicKey, 'test', KEYS.publicKey, State.ACTIVE, "1834284876");
    // console.log('gatewayToken:', gatewayToken);

    const mintHash = await kycTokenClient.issue(gatewayToken);
    console.log('mintHash:', mintHash);

    // const updateStateHash = await kycTokenClient.updateState(KEYS.publicKey, State.FROZEN, "2000000000");
    // console.log('updateStateHash:', updateStateHash);

    // const revokeHash = await kycTokenClient.revoke(KEYS.publicKey);
    // console.log('revokeHash:', revokeHash);
    
    // const freezeHash = await kycTokenClient.freeze(KEYS.publicKey);
    // console.log('freezeHash:', freezeHash);
    
    // const unfreezeHash = await kycTokenClient.unfreeze(KEYS.publicKey);
    // console.log('unfreezeHash:', unfreezeHash);
    
    // const updateExpiryHash = await kycTokenClient.updateExpiry(KEYS.publicKey, "1674284876");
    // console.log('updateExpiryHash:', updateExpiryHash);

    
    // const confirmDeployHash = await kycTokenClient.confirmDeploy(installDeployHash);
    // console.log('confirmDeployHash:', confirmDeployHash);

    // const token = await kycTokenClient.getKYCToken(KEYS.publicKey);
    // console.log('token:', token);
};

test();