import { CLPublicKey } from "casper-js-sdk";
import { KycTokenUIClient } from '../src/kyc-token-client-ui';

const TestKYCTokenUiClient = async () => {
    const nodeAddress = 'http://3.140.179.157:7777/rpc';
    const chain = 'integration-test';
    const contractHash = '83c6f2e89e454a2ae9f73e1cf56e0f1d9addb4249d8444aede79dd6688c14b4e';
    const address = '018d09882b9c7db8ff36ab335add1dafbd39a6269be9d5a7f7c9b7f31b045312b8';

    const kycTokenClient = new KycTokenUIClient(nodeAddress, chain);
    await kycTokenClient.setContractHash(contractHash);

    const name = await kycTokenClient.name();
    console.log(name);
    const totalSupply = await kycTokenClient.totalSupply();
    console.log(totalSupply);
    const myGatewayToken = await kycTokenClient.getGatewayToken(CLPublicKey.fromHex(address));
    console.log(myGatewayToken);
};

TestKYCTokenUiClient();
