const utils = require('@multiplechain/utils');

class Transaction {

    /**
     * @var {Object}
     */
    provider;

    /**
     * @var {String} 
     */
    hash;

    /**
     * @var {Object} 
     */
    data;

    /**
     * @var {Number}
     */
    timer;

    /**
     * @param {String} hash 
     */
    constructor(hash, provider) {
        this.provider = provider;
        this.hash = hash;
    }

    /**
     * @returns {String}
     */
    getHash() {
        return this.hash;
    }

    /**
     * @param {Number} timer 
     */
    setTimer(timer) {
        this.timer = timer;
    }
    
    /**
     * @returns {Object}
     */
    async getData() {
        try {

            let txApi;

            if (this.provider.testnet) {
                txApi = this.provider.api + 'tx/' + this.hash;
            } else {
                txApi = this.provider.api + 'rawtx/' + this.hash;
            }
            
            this.data = await fetch(txApi).then(res => res.json());
        } catch (error) {
            throw new Error('There was a problem retrieving transaction data!');
        }

        return this.data;
    }

    /** 
     * @returns {Number}
     */
    async getConfirmations() {
        try {

            let blockApi;
            if (this.provider.testnet) {
                blockApi = this.provider.api + 'blocks/tip/height';
            } else {
                blockApi = this.provider.api + 'latestblock';
            }

            if (!this.data) await this.getData();
            let latestBlock = await fetch(blockApi).then(res => res.json());

            if (typeof latestBlock == 'object') {
                latestBlock = latestBlock.height;
            }

            let blockHeight;
            if (this.provider.testnet) {
                blockHeight = this.data.status.block_height;
            } else {
                blockHeight = this.data.block_height;
            }

            return ((latestBlock - blockHeight) + 1);
        } catch (error) {}
    }

    /**
     * @param {Number} confirmations 
     * @returns {Number}
     */
    confirmTransaction(confirmations = 2) {
        return new Promise((resolve, reject) => {
            try {
                this.intervalConfirm = setInterval(async () => {
                    const trxConfirmations = await this.getConfirmations();
        
                    if (trxConfirmations >= confirmations) {
                        clearInterval(this.intervalConfirm);
                        return resolve(trxConfirmations);
                    }
                }, (this.timer*1000));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @returns {Boolean}
     */
    validateTransaction() {
        return new Promise((resolve, reject) => {
            this.intervalValidate = setInterval(async () => {
                try {

                    await this.getData();

                    let result = null;

                    if (this.data == null) {
                        result = false;
                    } else {
                        if (this.provider.testnet) {
                            if (this.data.status.block_height) {
                                result = true;
                            }
                        } else {
                            if (this.data.block_height) {
                                result = true;
                            }
                        }
                    }

                    if (typeof result == 'boolean') {
                        clearInterval(this.intervalValidate);
                        if (result == true) {
                            resolve(true);
                        } else {
                            reject(false);
                        }
                    }
    
                } catch (error) {
                    if (error.message == 'There was a problem retrieving transaction data!') {
                        this.validateTransaction();
                    } else {
                        clearInterval(this.intervalValidate);
                        reject(error);
                    }
                }
            }, (this.timer*1000));
        });
    }

    /**
     * @param {String} receiver 
     * @param {Number} amount 
     * @returns {Boolean}
     */
    async verifyTransferWithData(receiver, amount) {

        if (await this.validateTransaction()) {

            let data;
            if (this.provider.testnet) {

                let index = this.data.vout.findIndex(object => {
                    return object.scriptpubkey_address == receiver;
                });

                data = this.data.vout[index];
                
                data = {
                    receiver: data.scriptpubkey_address,
                    amount: utils.toDec(data.value, 8)
                };
            } else {
                
                let index = this.data.out.findIndex(object => {
                    return object.addr == receiver;
                });

                data = this.data.out[index];

                data = {
                    receiver: data.addr,
                    amount: utils.toDec(data.value, 8)
                };
            }

            if (data.receiver == receiver && data.amount == amount) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * @returns {String}
     */
    getUrl() {
        if (this.provider.testnet) {
            return this.provider.explorer + 'tx/' + this.hash;
        } else {
            return this.provider.explorer + 'transactions/btc/' + this.hash;
        }
    }
}

module.exports = Transaction;