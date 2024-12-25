const path = require("node:path");
const webpack = require("webpack");
const PugPlugin = require("pug-plugin");

const { DefinePlugin } = webpack;
const DIRNAME = __dirname;

module.exports = [
    {
        // devtool: false,

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
            assetModuleFilename: "[path][name].[hash][ext]"
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
                        DEV:
                            process.env.NODE_ENV === "development"
                                ? "true"
                                : "false",
                        NODE_ENV: JSON.stringify(
                            process.env.NODE_ENV ?? "production"
                        )
                    }
                }
            })
        ],

        resolve: {
            // extensions: [".js", ".jsx"],
            extensions: [
                ".web.tsx",
                ".web.ts",
                ".web.js",
                ".ts",
                ".tsx",
                ".js",
                ".jsx"
            ],
            extensionAlias: {
                ".js": [".ts", ".js"],
                ".jsx": [".tsx", ".jsx"],
                ".mjs": [".mts", ".mjs"]
            }
        },

        target: "web",
        // target: "electron-renderer",

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
            outputModule: true
        },

        externals: [
            "electron",
            "express",
            "keytar",
            "stacktracey",
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
        },

        resolve: {
            // No .ts included due to the typescript resolver plugin
            // extensions: [".ts", ".tsx", ".js"],
            extensionAlias: {
                ".js": [".ts", ".js"],
                ".mjs": [".mts", ".mjs"]
            }
        },

        target: "node20",

        watchOptions: {
            poll: 1000,
            ignored: /node_modules/
        }
    }
];
