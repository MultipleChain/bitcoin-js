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
    timer = 30;

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
            let txApi = this.provider.api + 'tx/' + this.hash;
            this.data = await fetch(txApi).then(res => res.json());
        } catch (error) {
            throw new Error('There was a problem retrieving transaction data!');
        }

        return this.data;
    }

    /**
     * @param {Object} options
     * @returns {Number}
     */
    async getTransferAmount(options) {
        let data = await this.getData();
        let receiver = options.receiver;
        let index = data.vout.findIndex(object => {
            return object.scriptpubkey_address == receiver;
        });
        data = data.vout[index];
        return utils.toDec(data.value, 8);
    }

    /** 
     * @returns {Number}
     */
    async getConfirmations() {
        try {

            let blockApi = this.provider.api + 'blocks/tip/height';
            if (!this.data) await this.getData();
            let latestBlock = await fetch(blockApi).then(res => res.json());

            if (typeof latestBlock == 'object') {
                latestBlock = latestBlock.height;
            }

            return ((latestBlock - (this.data.status.block_height || 0)) + 1);
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
                        if (this.data.status.block_height) {
                            result = true;
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
     * @param {Object} config
     * @returns {Boolean}
     */
    async verifyTransferWithData(config) {

        if (await this.validateTransaction()) {

            let index = this.data.vout.findIndex(object => {
                return object.scriptpubkey_address == config.receiver;
            });

            let data = this.data.vout[index];
            
            data = {
                receiver: data.scriptpubkey_address,
                amount: utils.toDec(data.value, 8)
            }

            if (data.receiver == config.receiver && data.amount == config.amount) {
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
        return this.provider.explorer + 'tx/' + this.hash;
    }
}

module.exports = Transaction;