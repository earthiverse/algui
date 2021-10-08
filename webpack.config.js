const CopyPlugin = require("copy-webpack-plugin")
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const path = require("path")

module.exports = {
    mode: "production",
    entry: "./source/index.ts",
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
        new HTMLInlineCSSWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                { from: "./source/images", to: "./images" },
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
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf|mp3|ogg|mp4)$/,
                loader: "file-loader",
                options: {
                    name: "[path][name].[ext]",
                    context: "public",
                },
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