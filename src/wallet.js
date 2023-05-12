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
        this.wallet = this.adapter.wallet;
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
    getType() {
        return this.adapter.type;
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
     * @returns {String}
     */
    connect() {
        return new Promise((resolve, reject) => {
            let time = 0;
            let timeout = 15;
            let timer = setInterval(async () => {
                time += 1;
                if (time > timeout) {
                    clearInterval(timer);
                    reject('timeout');
                }
            }, 1000);

            this.adapter.connect()
            .then(async (connectedAccount) => {
                let network = await this.wallet.getNetwork();
                if (this.provider.network == network) {
                    this.provider.setConnectedWallet(this);
                    resolve(this.connectedAccount = connectedAccount);
                } else {
                    reject('not-accepted-chain');
                }
            })
            .catch((error) => {
                utils.rejectMessage(error, reject);
            })
            .finally(() => {
                clearInterval(timer);
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
                
                coin.transfer(this.connectedAccount, to, amount)
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