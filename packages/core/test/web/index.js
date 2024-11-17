import { expect } from "chai";
import { init } from "../../source/index.web.js";
import { getSharedAppEnv } from "../../source/env/appEnv.js";

init();

Object.assign(window, {
    expect
});

getSharedAppEnv().getProperty("crypto/v1/setDerivationRounds")(10);
