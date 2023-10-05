module.exports = leather = (provider) => {
    
    const wallet = window.btc;

    const connect = async () => {
        return new Promise(async (resolve, reject) => {
            try {
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
        detected: Boolean(typeof window.btc !== 'undefined' && window.btc.request)
    }
}
