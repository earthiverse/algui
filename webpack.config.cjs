import CopyPlugin from "copy-webpack-plugin"
import HTMLInlineCSSWebpackPlugin from "html-inline-css-webpack-plugin"
import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin, { loader as _loader } from "mini-css-extract-plugin"
import { resolve as _resolve } from "path"

export const mode = "production"
export const entry = "./source/client/index.ts"
export const output = {
    path: _resolve(__dirname, "./docs/client"),
    filename: "index.js",
}
export const plugins = [
    new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css"
    }),
    new HtmlWebpackPlugin(),
    new HTMLInlineCSSWebpackPlugin(),
    new CopyPlugin({
        patterns: [
            { from: "./source/client/images", to: "./images" },
        ],
    }),
]
export const target = "web"
export const module = {
    rules: [
        {
            test: /\.ts$/,
            use: "ts-loader",
            exclude: /node_modules/,
        },
        {
            test: /\.css$/,
            use: [
                _loader,
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
}
export const resolve = {
    extensions: [".ts", ".js"],
}
export const devServer = {
    open: true,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
    },
}