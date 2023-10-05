const {getAddress, sendBtcTransaction, BitcoinNetworkType} = require('sats-connect');

module.exports = xverse = (provider) => {
    
    const type = provider.testnet ? 
                    BitcoinNetworkType.Testnet: 
                    BitcoinNetworkType.Mainnet;

    let wallet = {
        sendBitcoin: (to, amount) => {
            return new Promise(async (resolve, reject) => {
                sendBtcTransaction({
                    payload: {
                        network: {
                            type,
                        },
                        recipients: [
                            {
                                address: to,
                                amountSats: BigInt(amount),
                            }
                        ],
                        senderAddress: provider.connectedWallet.connectedAccount,
                    },
                    onFinish: (txId) => {
                        resolve(txId);
                    },
                    onCancel: () => {
                        reject('request-rejected');
                    }
                });
            });
        }
    }

    const connect = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                getAddress({
                    payload: {
                        purposes: ['ordinals', 'payment'],
                        message: 'Address for receiving Ordinals and payments',
                        network: {
                            type
                        },
                    },
                    onFinish: ({addresses}) => {
                        const bitcoin = Object.values(addresses).find(address => address.purpose == 'payment');
                        
                        // for ordinals & BRC-20 integrations
                        // const ordinals = addresses.find(address => address.purpose == 'ordinals');

                        wallet = Object.assign(wallet, window.XverseProviders.BitcoinProvider);
                        
                        wallet.getAddress = async () => {
                            return bitcoin.address;
                        }

                        resolve(wallet);
                    },
                    onCancel: () => {
                        reject('request-rejected');
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    return {
        key: 'xverse',
        name: 'Xverse',
        supports: [
            'browser',
            'mobile'
        ],
        connect,
        download: 'https://www.xverse.app/download',
        detected: Boolean(typeof window.XverseProviders !== 'undefined' && XverseProviders.BitcoinProvider)
    }
}
