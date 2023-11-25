const getAdapter = require('./get-adapter');
const utils = require('./utils');

class Wallet {

    /**
     * @var {Object}
     */
    adapter;

    /**
     * @var {Object}
     */
    wallet;
    
    /**
     * @var {Object}
     */
    provider;
    
    /**
     * @var {String}
     */
    connectedAccount;

    /**
     * @param {String} adapter 
     * @param {Object} provider 
     */
    constructor(adapter, provider) {
        this.provider = provider;
        this.setAdapter(adapter);
    }

    /**
     * @param {String} adapter 
     */
    setAdapter(adapter) {
        this.adapter = getAdapter(adapter, this.provider);
    }

    /**
     * @returns {String}
     */
    getKey() {
        return this.adapter.key;
    }

    /**
     * @returns {String}
     */
    getName() {
        return this.adapter.name;
    }

    /**
     * @returns {String}
     */
    getSupports() {
        return this.adapter.supports;
    }

    /**
     * @returns {String}
     */
    getDeepLink() {
        return this.adapter.deepLink;
    }

    /**
     * @returns {String}
     */
    getDownloadLink() {
        return this.adapter.download;
    }

    /**
     * @returns {Boolean}
     */
    isDetected() {
        return this.adapter.isDetected();
    }

    /**
     * @returns {String}
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.adapter.connect()
            .then(async (wallet) => {
                this.wallet = wallet;
                this.connectedAccount = await wallet.getAddress();
                this.provider.setConnectedWallet(this);
                resolve(this.connectedAccount);
            })
            .catch((error) => {
                utils.rejectMessage(error, reject);
            });
        });
    }

    /**
     * @returns {Array}
     */
    getAccounts() {
        return this.wallet.getAccounts();
    }

    /**
     * @returns {String}
     */
    getPublicKey() {
        return this.wallet.getPublicKey();
    }
    

    /**
     * @param {String} to
     * @param {Integer} amount
     * @return {Transaction|Object}
     * @throws {Error}
     */
    coinTransfer(to, amount) {
        return new Promise(async (resolve, reject) => {
            try {
                let coin = this.provider.Coin();
                if (parseFloat(amount) > await coin.getBalance(this.connectedAccount)) {
                    return reject('insufficient-balance');
                }

                amount = utils.toSatoshi(amount);

                this.wallet.sendBitcoin(to, amount)
                .then((transactionId) => {
                    resolve(this.provider.Transaction(transactionId));
                })
                .catch((error) => {
                    utils.rejectMessage(error, reject);
                });
            } catch (error) {
                utils.rejectMessage(error, reject);
            }
        });
    }

    // TODO: implement
    tokenTransfer(to, amount, tokenAddress) {
    }

    /**
     * @param {String} to
     * @param {Integer} amount
     * @param {String|null} tokenAddress
     * @return {Transaction|Object}
     * @throws {Error}
     */
    transfer(to, amount, tokenAddress = null) {
        if (tokenAddress) {
            return this.tokenTransfer(to, amount, tokenAddress);
        } else {
            return this.coinTransfer(to, amount);
        }
    }

    // Events
    accountsChanged(callback) {
        this.wallet.on('accountsChanged', (accounts) => {
            callback(accounts);
        });
    }

    networkChanged(callback) {
        this.wallet.on('networkChanged', (network) => {
            callback(network);
        });
    }
    
} 

module.exports = Wallet;