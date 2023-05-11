const Transaction = require("./transaction");
const utils = require("@multiplechain/utils");

class Provider {

    api;

    explorer;
    
    testnet;

    constructor(testnet = false) {
        this.testnet = testnet;

        if (!this.testnet) {
            this.api = "https://blockstream.info/api/";
            this.explorer = "https://blockstream.info/";
        } else {
            this.api = "https://blockstream.info/testnet/api/";
            this.explorer = "https://blockstream.info/testnet/";
        }
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

    async getAddressLastTransaction(receiver) {
        
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

    Transaction(hash) {
        return new Transaction(hash, this);
    }
}

module.exports = Provider;