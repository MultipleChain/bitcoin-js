module.exports = (provider) => {
    
    const wallet = window?.trustwallet?.bitcoin;

    const connect = async () => {
        return new Promise(async (resolve, reject) => {
            try {
                wallet.requestAccounts()
                .then(async () => {
                    resolve(wallet);
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
        key: 'trustwallet',
        name: 'Trust Wallet',
        supports: [
            'browser',
            'mobile'
        ],
        connect,
        download: 'https://trustwallet.com/download',
        isDetected : () => Boolean(window?.trustwallet?.bitcoin?.isTrust)
    }
}
