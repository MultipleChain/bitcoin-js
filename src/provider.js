const Transaction = require("./transaction");
const utils = require("@multiplechain/utils");

class Provider {

    api;

    explorer;
    
    testnet;

    constructor(testnet = false) {
        this.testnet = testnet;

        if (!this.testnet) {
            this.api = "https://blockchain.info/";
            this.explorer = "https://www.blockchain.com/explorer/";
        } else {
            this.api = "https://blockstream.info/testnet/api/";
            this.explorer = "https://blockstream.info/testnet/";
        }
    }

    getWalletOpenLink(address, amount) {
        return 'bitcoin' + ':' + String(address).toUpperCase() + '?amount=' + amount;
    }

    async getAddressLastTransaction(receiver) {
        
        let apiUrl;
        if (this.testnet) {
            apiUrl = this.api + 'address/' + receiver + '/txs';
        } else {
            apiUrl = this.api + 'rawaddr/' + receiver;
        }

        let data = await fetch(apiUrl).then(res => res.json());

        if (data.length == 0) {
            return {
                hash: null,
                amount: 0
            }
        }

        if (data.txs) {

            let tx = data.txs[0];

            let index = tx.out.findIndex(object => {
                return object.addr == receiver;
            });

            data = tx.out[index];
            
            return {
                hash: tx.hash,
                amount: utils.toDec(data.value, 8)
            }
        } else {
            
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
    }

    Transaction(hash) {
        return new Transaction(hash, this);
    }
}

module.exports = Provider;