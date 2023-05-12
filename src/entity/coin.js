const utils = require('../utils');

class Coin {

    /**
     * @var {String} 
     */
    symbol;

    /**
     * @var {String} 
     */
    decimals;

    /**
     * @var {Provider} 
     */
    provider;

    /**
     * @param {Provider} provider 
     */
    constructor(provider) {
        this.provider = provider;
        this.decimals = 8;
        this.symbol = 'BTC';
    }

    /**
     * @returns {String}
     */
    getSymbol() {
        return this.symbol;
    }

    /**
     * @returns {Integer}
     */
    getDecimals() {
        return this.decimals;
    }

    /**
     * @returns {Object}
     */
    async getBalance() {
        let balance = await this.provider.connectedWallet.wallet.getBalance();
        return {
            confirmed: utils.toDec(balance.confirmed, this.getDecimals()),
            unconfirmed: utils.toDec(balance.unconfirmed, this.getDecimals()),
            total: utils.toDec(balance.total, this.getDecimals())
        }
    }

    /**
     * @returns {Number}
     */
    async getConfirmedBalance() {
        let balance = await this.getBalance();
        return balance.confirmed;
    }

    /**
     * @returns {Number}
     */
    async getUnconfirmedBalance() {
        let balance = await this.getBalance();
        return balance.unconfirmed;
    }

    /**
     * @returns {Number}
     */
    async getTotalBalance() {
        let balance = await this.getBalance();
        return balance.total;
    }


    /**
     * @param {String} from
     * @param {String} to 
     * @param {Number} amount 
     * @returns {String|Object}
     */
    transfer(from, to, amount) {
        return new Promise(async (resolve, reject) => {

            if (parseFloat(amount) > await this.getConfirmedBalance(from)) {
                return reject('insufficient-balance');
            }

            amount = utils.toSatoshi(amount);
            this.provider.connectedWallet.wallet.sendBitcoin(to, amount)
            .then((txid) => {
                resolve(txid);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }
}

module.exports = Coin;