import { CLPublicKey, Signer } from "casper-js-sdk";
import { GatewayToken as GatewayUIToken } from "../src";
import { KycTokenUIClient } from '../src/kyc-token-client-ui';

enum State {
    ACTIVE = 'ACTIVE',
    REVOKED = 'REVOKED',
    FROZEN = 'FROZEN',
}

export type GatewayToken = {
    readonly issuingGatekeeper: string;
    readonly gatekeeperNetworkAddress: string;
    readonly owner: string;
    readonly state: State;
    readonly identifier: string;
    readonly expiryTime?: number;
};

export interface WalletAdapter {
    publicKey: CLPublicKey;
}

const chainImplementation = async ({
    nodeAddress,
    contractHash,
    clusterUrl,
    wallet,
}: {
    nodeAddress: string;
    contractHash: string;
    clusterUrl: string;
    wallet: WalletAdapter | undefined;
}) => {
    const kycTokenClient = new KycTokenUIClient(nodeAddress, clusterUrl);
    await kycTokenClient.setContractHash(contractHash);

    const onGatewayTokenChange = (account: CLPublicKey): Promise<GatewayUIToken | undefined> => {
        let prevStatus: any = null;
        return new Promise(async (resolve, reject) => {
            setInterval(async () => {
                let onChainToken;
                try {
                    onChainToken = await kycTokenClient.getGatewayToken(account);
                } catch (e) {
                    onChainToken = undefined;
                }
                if (onChainToken?.status !== prevStatus && prevStatus !== null) {
                    resolve(onChainToken);
                }
                prevStatus = onChainToken?.status;
            }, 15 * 1000);
        });
    }

    return {
        addOnGatewayTokenChangeListener: (
            gatewayToken: GatewayToken,
            tokenDidChange: (GatewayToken: GatewayToken) => void
        ): number => {
            if (!wallet) {
                throw new Error('No wallet connected');
            }
            onGatewayTokenChange(wallet.publicKey)
                .then((token: GatewayUIToken) => {
                    tokenDidChange({
                        expiryTime: Number(token.expiryTime),
                        gatekeeperNetworkAddress: token.gatekeeperNetwork,
                        identifier: token.account.toHex(),
                        issuingGatekeeper: token.issuingGatekeeper.toHex(),
                        owner: wallet.publicKey.toHex(),
                        state: token.status,
                    });
                });
            return 1;
        },
        findGatewayToken: async (): Promise<GatewayToken | undefined> => {
            if (!wallet) {
                throw new Error('No wallet connected');
            }

            const onChainToken = await kycTokenClient.getGatewayToken(wallet.publicKey);

            if (!onChainToken) {
                return undefined;
            }

            return {
                expiryTime: Number(onChainToken.expiryTime),
                gatekeeperNetworkAddress: onChainToken.gatekeeperNetwork,
                identifier: onChainToken.account.toHex(),
                issuingGatekeeper: onChainToken.issuingGatekeeper.toHex(),
                owner: wallet.publicKey.toHex(),
                state: onChainToken.status,
            };
        },
        proveWalletOwnership: async (): Promise<string> => {
            if (!wallet) {
                throw new Error('No wallet connected');
            }
            return Signer.signMessage("I declare ownership of this wallet", wallet.publicKey.toHex());
        },
        removeOnGatewayTokenChangeListener: () => {

        },
    };
};

const TestKYCTokenUiClient = async () => {
    const wallet: WalletAdapter = {
        publicKey: CLPublicKey.fromHex('017f353710d3d07d0df74d510ff7fceec3ef35a1b1f712909f0966d7a0ebb14e99'),
    };
    const { findGatewayToken, proveWalletOwnership } = await chainImplementation({
        clusterUrl: 'integration-test',
        contractHash: '83c6f2e89e454a2ae9f73e1cf56e0f1d9addb4249d8444aede79dd6688c14b4e',
        nodeAddress: 'http://3.140.179.157:7777/rpc',
        wallet,
    });

    const token = await findGatewayToken();
    console.log('$$$$', token);
};

TestKYCTokenUiClient();
