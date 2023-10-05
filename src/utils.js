const BigNumber = require('bignumber.js');
const utils = require('@multiplechain/utils');

module.exports = Object.assign(utils, {
    toSatoshi(amount) {
        let decimals = 8;
        let length = '1' + '0'.repeat(decimals);
        let value = new BigNumber(amount.toString(10), 10).times(length);
        return parseInt(value.toString(10));
    },
    toBitcoin(amount) {
        return parseFloat(amount.toString(10) / 100000000);
    },
    rejectMessage(error, reject) {
        
        if (typeof error == 'object') {
            if (error.code == 4001 || error.message == 'User rejected the request.') {
                return reject('request-rejected');
            } else if (String(error).includes('is not valid JSON')) {
                return reject('not-accepted-chain');
            }
        }

        return reject(error);
    }
})