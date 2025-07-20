const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/assets',
                    to: 'assets',
                    noErrorOnMissing: true
                }
            ]
        })
    ],
    devServer: {
        static: './dist',
        port: 5000,
        hot: true,
        host: '0.0.0.0',
        allowedHosts: 'all',
        proxy: [
            {
                context: ['/api'],
                target: 'http://localhost:8000',
                changeOrigin: true,
            }
        ],
        historyApiFallback: true
    },
    resolve: {
        extensions: ['.js']
    },
    mode: 'development'
};