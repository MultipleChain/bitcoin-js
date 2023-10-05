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
    async getBalance(address) {
        let addressStatsApi = this.provider.api + 'address/' + address;
        let addressStats = await fetch(addressStatsApi).then(res => res.json());
        let balanceSat = addressStats.chain_stats.funded_txo_sum - addressStats.chain_stats.spent_txo_sum;
        return utils.toBitcoin(balanceSat);
    }

    /**
     * @param {String} from
     * @param {String} to 
     * @param {Number} amount 
     * @returns {String|Object}
     */
    transfer(from, to, amount) {
        return new Promise(async (resolve, reject) => {

            if (parseFloat(amount) > await this.getBalance(from)) {
                return reject('insufficient-balance');
            }

            amount = utils.toSatoshi(amount);
            
            // develop for be side
        
        });
    }
}

module.exports = Coin;