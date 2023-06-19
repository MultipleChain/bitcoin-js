const utils = require("@multiplechain/utils");
const Coin = require("./entity/coin");
const Token = require("./entity/token");
const Transaction = require("./entity/transaction");

class Provider {

    /**
     * @var {String}
     */
    api;

    /**
     * @var {String}
     */
    explorer;
    
    /**
     * @var {Boolean}
     */
    testnet;

    /**
     * @var {String}
     */
    network;

    /**
     * @var {Object}
     */
    detectedWallets = [];

    /**
     * @var {Object}
     */
    connectedWallet;

    constructor(testnet = false) {
        this.testnet = testnet;
        this.network = testnet ? 'testnet' : 'livenet';

        if (!this.testnet) {
            this.api = "https://blockstream.info/api/";
            this.explorer = "https://blockstream.info/";
        } else {
            this.api = "https://blockstream.info/testnet/api/";
            this.explorer = "https://blockstream.info/testnet/";
        }

        this.detectWallets();
    }

    getWalletOpenLink(address, amount) {
        return 'bitcoin' + ':' + String(address).toUpperCase() + '?amount=' + amount;
    }

    errorCheck(data) {
        if (typeof data == 'string') {
            if (data == 'Address on invalid network') {
                return {
                    error: 'invalid-address'
                }
            } else {
                return {
                    error: 'any-error'
                }
            }
        } else if (data.error) {
            if (data.error == 'not-found-or-invalid-arg') {
                return {
                    error: 'invalid-address'
                }
            } else {
                return {
                    error: 'any-error'
                }
            }
        }

        return data;
    }

    /**
     * @param {String} receiver 
     * @returns 
     */
    async getLastTransactionByReceiver(receiver) {
        
        let apiUrl = this.api + 'address/' + receiver + '/txs';
        let data = await fetch(apiUrl).then(response => response.text());
        try {
            data = JSON.parse(data);
        } catch (error) {}
        
        data = this.errorCheck(data);
        if (data.error) {
            return data;
        }

        if (data.length == 0) {
            return {
                hash: null,
                amount: 0
            }
        }
            
        let tx = data[0];

        let index = tx.vout.findIndex(object => {
            return object.scriptpubkey_address == receiver;
        });

        data = tx.vout[index];

        return {
            hash: tx.txid,
            amount: utils.toDec(data.value, 8)
        };
    }

    /**
     * @param {Wallet} wallet 
     */
    setConnectedWallet(wallet) {
        this.connectedWallet = wallet;
    }

    /**
     * @param {String} adapter 
     * @returns {Promise}
     */
    connectWallet(adapter) {
        return new Promise(async (resolve, reject) => {
            if (this.detectedWallets[adapter]) {
                let wallet = this.detectedWallets[adapter];
                wallet.connect()
                .then(() => {
                    resolve(wallet);
                })
                .catch(error => {
                    
                });
            } else {
                reject('wallet-not-found');
            }
        });
    }

    /**
     * @param {Array} filter 
     * @returns {Array}
     */
    getDetectedWallets(filter) {
        if (!filter) return this.detectedWallets;
        return Object.fromEntries(Object.entries(this.detectedWallets).filter(([key]) => {
            return filter.includes(key);
        }));
    }

    detectWallets() {
        if (typeof window != 'undefined') {
            const Wallet = require('./wallet');

            if (typeof window.unisat !== 'undefined' && unisat.requestAccounts) {
                this.detectedWallets['unisat'] = new Wallet('unisat', this);
            }
        }
    }

    Coin() {
        return new Coin(this);
    }

    Token(address) {
        return new Token(address, this);
    }

    Transaction(hash) {
        return new Transaction(hash, this);
    }
}

module.exports = Provider;