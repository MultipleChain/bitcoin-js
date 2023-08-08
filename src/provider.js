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
     * @var {Boolean}
     */
    qrPayments = true;

    /**
     * @var {String}
     */
    wsUrl;
    
    /**
     * @var {Object}
     */
    detectedWallets = [];

    /**
     * @var {Object}
     */
    connectedWallet;

    /**
     * @param {Object} options 
     */
    constructor(options) {
        
        this.testnet = options.testnet;
        this.network = options.testnet ? 'testnet' : 'livenet';

        if (!this.testnet) {
            this.api = "https://blockstream.info/api/";
            this.explorer = "https://blockstream.info/";
            this.wsUrl = "wss://mempool.space/api/v1/ws";
        } else {
            this.api = "https://blockstream.info/testnet/api/";
            this.explorer = "https://blockstream.info/testnet/";
            this.wsUrl = "wss://mempool.space/testnet/api/v1/ws";
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

    listenTransactions(options, callback) {
        let receiver = options.receiver;
        let ws = new WebSocket(this.wsUrl);
        let subscription = {
            unsubscribe: () => {
                ws.close();
            }
        }
    
        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({ 'track-address': receiver }));
        });

        let startCallback = async (data) => {
            try {
                let tx = this.Transaction(data['address-transactions'][0].txid);
                await tx.getData();
                callback(subscription, tx);
            } catch (error) {
                setTimeout(() => {
                    startCallback(data);
                }, 2500);
            }
        }
    
        ws.addEventListener('message', (res) => {
            setTimeout(() => {
                startCallback(JSON.parse(res.data));
            }, 6000);
        });
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
     * @param {Array|null} filter 
     * @returns {Array}
     */
    getSupportedWallets(filter) {
        
        const Wallet = require('./wallet');

        const wallets = {
            unisat: new Wallet('unisat', this)
        };
        
        return Object.fromEntries(Object.entries(wallets).filter(([key]) => {
            return !filter ? true : filter.includes(key);
        }));
    }

    /**
     * @param {Array|null} filter 
     * @returns {Array}
     */
    getDetectedWallets(filter) {
        return Object.fromEntries(Object.entries(this.detectedWallets).filter(([key]) => {
            return !filter ? true : filter.includes(key);
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