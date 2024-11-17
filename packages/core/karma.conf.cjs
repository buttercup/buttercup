const webpackConfig = require("./webpack.config.cjs");

const CI =  !!process.env.CI;

delete webpackConfig.entry;
delete webpackConfig.output;
webpackConfig.mode = process.env.BUNDLE === "production" ? "production" : "development";
webpackConfig.module.rules.push({
    test: /\.(png|jpg)$/,
    use: "arraybuffer-loader"
});
// BEGIN typescript support
webpackConfig.module.rules.unshift({
    test: /\.js$/,
    use: [{
        loader: "babel-loader",
        options: {
            "presets": [
                ["@babel/preset-env", {
                    "useBuiltIns": false,
                    "targets": {
                        "firefox": "70"
                    }
                }]
            ],
            "plugins": [
                "@babel/plugin-proposal-class-properties",
                "@babel/plugin-proposal-object-rest-spread"
            ]
        }
    }]
});
const tsRule = webpackConfig.module.rules.find(rule => rule.test && /\.ts/.test(rule.test.toString()));
tsRule.use.options.configFile = tsRule.use.options.configFile.replace("tsconfig.web.json", "tsconfig.web.test.json");
// END typescript support

module.exports = config => config.set({

    basePath: __dirname,

    browsers: CI ? ["ChromeHeadless", "FirefoxHeadless"] : ["ChromeHeadless"],

    captureTimeout: 60000,

    colors: true,

    // coverageReporter: {
    //     dir: "build/coverage/",
    //     reporters: [
    //         { type: "html" },
    //         { type: "text" },
    //         { type: "text-summary" }
    //     ]
    // },

    exclude: [],

    files: [
        { pattern: "source/index.web.ts" },
        { pattern: "test/web/index.js" },
        { pattern: "test/web/**/*.spec.js" }
    ],

    frameworks: ["mocha", "sinon", "webpack"],

    // logLevel: config.LOG_DEBUG,

    plugins: [
        require("karma-webpack"),
        require("karma-chrome-launcher"),
        require("karma-firefox-launcher"),
        require("karma-mocha"),
        require("karma-sinon"),
        require("karma-spec-reporter")
    ],

    preprocessors: {
        "*.ts": ["webpack"],
        "test/web/index.js": ["webpack"],
        "test/web/**/*.spec.js": ["webpack"]
    },

    reporters: ["spec", "progress"],

    singleRun: true,

    webpack: webpackConfig

});
