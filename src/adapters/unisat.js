module.exports = unisat = (provider) => {
    
    const wallet = window.unisat;

    wallet.getAddress = async () => {
        return (await wallet.getAccounts())[0];
    }

    const connect = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                wallet.requestAccounts()
                .then(async () => {
                    wallet.switchNetwork(provider.network)
                    .then(async () => {
                        resolve(wallet);
                    })
                    .catch(error => {
                        reject(error);
                    });
                })
                .catch(error => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    return {
        key: 'unisat',
        name: 'UniSat',
        supports: ['browser'],
        connect,
        download: 'https://unisat.io/download',
        detected: Boolean(typeof window.unisat !== 'undefined' && window.unisat.requestAccounts)
    }
}
