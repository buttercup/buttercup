const path = require("node:path");
const webpack = require("webpack");
const ResolveTypeScriptPlugin = require("resolve-typescript-plugin");
const PugPlugin = require("pug-plugin");

const { DefinePlugin } = webpack;
const DIRNAME = __dirname;

module.exports = [
    {
        devtool: false,

        entry: {
            index: path.join(DIRNAME, "./source/ui/index.pug")
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(DIRNAME, "./tsconfig.json")
                        }
                    },
                    resolve: {
                        fullySpecified: false
                    },
                    exclude: /node_modules/
                },
                {
                    test: /\.pug$/,
                    loader: PugPlugin.loader
                },
                {
                    test: /\.css$/i,
                    use: ["css-loader"]
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // Translates CSS into CommonJS
                        "css-loader",
                        // Compiles Sass to CSS
                        "sass-loader"
                    ]
                },
                {
                    test: /\.(jpe?g|gif|png|svg|woff|woff2)$/,
                    type: "asset/resource"
                }
            ]
        },

        output: {
            filename: "ui.js",
            path: path.resolve(DIRNAME, "./dist/ui"),
            assetModuleFilename: "[path][name].[hash][ext]",
            // publicPath: "/"
        },

        plugins: [
            new PugPlugin({
                pretty: false,
                js: {
                    filename: "js/[name].[contenthash:8].js"
                },
                css: {
                    filename: "css/[name].[contenthash:8].css"
                }
            }),
            new DefinePlugin({
                process: {
                    env: {
                        DEV: process.env.NODE_ENV === "development" ? "true" : "false",
                        NODE_ENV: JSON.stringify(process.env.NODE_ENV ?? "production")
                    }
                }
            })
        ],

        resolve: {
            alias: {
                "react-native$": "react-native-web"
            },
            // No .ts/.tsx included due to the typescript resolver plugin
            extensions: [".js", ".jsx"],
            plugins: [
                // Handle .ts => .js resolution
                new ResolveTypeScriptPlugin()
            ]
        },

        target: "web",

        watchOptions: {
            poll: 1000,
            ignored: /node_modules/
        }
    },
    {
        devtool: false,

        entry: {
            index: path.join(DIRNAME, "./source/backend/index.ts")
        },

        experiments: {
            outputModule: true,
        },

        externals: [
            "electron",
            "express",
            "keytar",
            "zod"
        ].reduce((output, name) => ({ ...output, [name]: name }), {}),

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(DIRNAME, "./tsconfig.json")
                        }
                    },
                    resolve: {
                        fullySpecified: false
                    },
                    exclude: /node_modules/
                }
            ]
        },

        output: {
            filename: "index.js",
            path: path.resolve(DIRNAME, "./dist/backend"),
            module: true
            // libraryTarget: "commonjs2",
            // path: path.resolve(__dirname, "./build/main")
        },

        resolve: {
            // No .ts included due to the typescript resolver plugin
            extensions: [".js"],
            plugins: [
                // Handle .ts => .js resolution
                new ResolveTypeScriptPlugin()
            ]
        },

        // target: "electron-main",
        target: "node20",
        // target: "async-node",

        watchOptions: {
            poll: 1000,
            ignored: /node_modules/
        }
    }
];
