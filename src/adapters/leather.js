module.exports = leather = (provider) => {

    if (window.crypto && !window.crypto.randomUUID) {
        window.crypto.randomUUID = () => {
            let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
            return uuid;
        };
    }

    const network =  provider.testnet ? 'testnet' : 'mainnet';

    let wallet = Object.assign({
        sendBitcoin: (to, amount) => {
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
        },
        on: (event, callback) => {
            if (window.btc && btc.listen) {
                btc.listen(event, callback);
            }
        }
    }, window.LeatherProvider);

    const connect = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                const addresses = (await wallet.request('getAddresses', {
                    network
                })).result.addresses;
                const bitcoin = addresses.find(address => address.type == 'p2wpkh');

                // for ordinals & BRC-20 integrations
                // const ordinals = addresses.find(address => address.type == 'p2tr');

                wallet = Object.assign(wallet, window.LeatherProvider);
                
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
        isDetected: () => Boolean(typeof window.LeatherProvider !== 'undefined')
    }
}
