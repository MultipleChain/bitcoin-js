module.exports = leather = (provider) => {
    
    let wallet = window.LeatherProvider;
    const network =  provider.testnet ? 'testnet' : 'mainnet';

    wallet.sendBitcoin = (to, amount) => {
        return new Promise(async (resolve, reject) => {
            try {
                await wallet.request('sendTransfer', {
                    address: to,
                    amount,
                    network
                })
                .then((response) => {
                    resolve(response.result.txid);
                })
                .catch(({error}) => {
                    reject(error);
                });
            } catch (error) {
                reject(error)
            }
        });
    }

    wallet.on = (event, callback) => {
        if (window.btc && btc.listen) {
            btc.listen(event, callback);
        }
    }

    const connect = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                const addresses = (await wallet.request('getAddresses', {
                    network
                })).result.addresses;
                const bitcoin = addresses.find(address => address.type == 'p2wpkh');

                // for ordinals & BRC-20 integrations
                // const ordinals = addresses.find(address => address.type == 'p2tr');

                wallet.getAddress = async () => {
                    return bitcoin.address;
                }

                resolve(wallet);
            } catch (error) {
                reject(error);
            }
        });
    }

    return {
        key: 'leather',
        name: 'Leather',
        supports: ['browser'],
        connect,
        download: 'https://leather.io/install-extension',
        detected: Boolean(typeof window.LeatherProvider !== 'undefined')
    }
}
