const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: './src/provider.js',
    output: {
        path: path.join(__dirname, "/dist"),
        filename: 'bitcoin-provider.js',
        library: 'Bitcoin',
        libraryTarget: 'umd',
        globalObject: 'this',
        umdNamedDefine: true,
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        fallback: {
            http: false, 
            https: false,
            stream: false
        }
    }
};