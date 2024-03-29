const Coin = require("./entity/coin");
const Token = require("./entity/token");
const Transaction = require("./entity/transaction");

if (typeof window === 'undefined') {
    WebSocket = require('ws');
}

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
    supportedWallets;

    /**
     * @var {Object}
     */
    connectedWallet;

    /**
     * @var {String}
     */
    blockcypherToken;

    /**
     * @param {Object} options 
     */
    constructor(options = {}) {
        
        this.testnet = options.testnet;
        this.network = options.testnet ? 'testnet' : 'mainnet';
        this.blockcypherToken = options.blockcypherToken;

        if (this.testnet) {
            this.api = "https://blockstream.info/testnet/api/";
            this.explorer = "https://blockstream.info/testnet/";
            let token = this.blockcypherToken || "6d9cba333f234b9498473955497c40d9";
            this.wsUrl = "wss://socket.blockcypher.com/v1/btc/test3?token=" + token;
        } else {
            this.api = "https://blockstream.info/api/";
            this.explorer = "https://blockstream.info/";
            if (this.blockcypherToken) {
                this.wsUrl = "wss://socket.blockcypher.com/v1/btc/main?token=" + this.blockcypherToken;
            } else {
                this.wsUrl = "wss://ws.blockchain.info/inv";
            }
        }
    }

    getWalletOpenLink(address, amount) {
        return 'bitcoin' + ':' + String(address).toUpperCase() + '?amount=' + amount;
    }

    listenTransactions(options, callback) {
        let receiver = options.receiver;
        let ws = new WebSocket(this.wsUrl);

        let message;
        if (this.testnet || this.blockcypherToken) {
            message = JSON.stringify({
                event: "unconfirmed-tx",
                address: receiver,
                token: this.blockcypherToken || "6d9cba333f234b9498473955497c40d9"
            });
        } else {
            message = JSON.stringify({
                "op": "unconfirmed_sub"
            });
        }

        let subscription = {
            unsubscribe: () => {
                if (!this.testnet && !this.blockcypherToken) {
                    ws.send(JSON.stringify({
                        "op": "unconfirmed_unsub"
                    }));
                }
                ws.close();
            }
        }

        let startCallback = async (data) => {
            try {
                let tx = this.Transaction(data.hash || data.x.hash);
                await tx.getData();
                callback(subscription, tx);
            } catch (error) {
                setTimeout(() => {
                    startCallback(data);
                }, 2500);
            }
        }

        ws.addEventListener('open', () => {
            ws.send(message);
        });

        ws.addEventListener('message', (res) => {
            let result = true;
            let data = JSON.parse(res.data);
            
            if (!this.testnet && !this.blockcypherToken) {
                result = data.x.out.find(o => {
                    return String(o.addr).toLowerCase() == receiver.toLowerCase();
                });
            }

            if (result) {
                setTimeout(() => {
                    startCallback(data);
                }, 6000);
            }
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
            let detectedWallets = this.getDetectedWallets();
            if (detectedWallets[adapter]) {
                let wallet = detectedWallets[adapter];
                wallet.connect()
                .then(() => {
                    resolve(wallet);
                })
                .catch(error => {
                    reject(error);
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
        if (!this.supportedWallets) {
            const Wallet = require('./wallet');

            this.supportedWallets = {
                unisat: new Wallet('unisat', this),
                xverse: new Wallet('xverse', this),
                leather: new Wallet('leather', this),
                trustwallet: new Wallet('trustwallet', this),
            }
        }

        return Object.fromEntries(Object.entries(this.supportedWallets).filter(([key]) => {
            return !filter ? true : filter.includes(key);
        }));
    }

    /**
     * @param {Array|null} filter 
     * @returns {Array}
     */
    getDetectedWallets(filter) {
        let detectedWallets = this.getSupportedWallets(filter);
        return Object.fromEntries(Object.entries(detectedWallets).filter(([key, value]) => {
            return value.isDetected() == undefined ? true : value.isDetected()
        }));
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