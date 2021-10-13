/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require("copy-webpack-plugin")
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const WebpackCdnPlugin = require("webpack-cdn-plugin")
const path = require("path")

module.exports = {
    mode: "production",
    entry: "./source/client/index.ts",
    output: {
        path: path.resolve(__dirname, "./docs"),
        filename: "gui.js",
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new HtmlWebpackPlugin(),
        new WebpackCdnPlugin({
            modules: [
                {
                    name: "pixi.js",
                    prodUrl: "https://cdnjs.cloudflare.com/ajax/libs/:name/:version/browser/pixi.min.js",
                    var: "PIXI"
                },
                {
                    name: "@pixi/layers",
                    prodUrl: "https://unpkg.com/:name@:version/dist/pixi-layers.umd.min.js",
                    var: "PIXI.display"
                },
                {
                    name: "pixi-cull",
                    var: "Cull"
                },
                {
                    name: "pixi-viewport",
                    prodUrl: "https://www.unpkg.com/pixi-viewport@4.33.0/dist/viewport.min.js",
                    var: "pixi_viewport"
                }
            ]
        }),
        new HTMLInlineCSSWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                { from: "./source/client/images", to: "./images" },
            ],
        }),
    ],
    target: "web",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf|mp3|ogg|mp4)$/,
                loader: "file-loader",
                options: {
                    name: "[path][name].[ext]",
                    context: "public",
                },
                exclude: /node_modules/
            },
        ]
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    devServer: {
        open: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
        },
    },
}