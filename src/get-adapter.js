const adapters = {
    unisat: require('./adapters/unisat'),
    xverse: require('./adapters/xverse'),
    leather: require('./adapters/leather'),
}

/**
 * @param {String} adapter
 * @param {Object} provider
 */
module.exports = getAdapter = (adapter, provider) => {
    return adapters[adapter](provider);
}