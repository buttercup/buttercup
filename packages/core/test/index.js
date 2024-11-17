import { init } from "../dist/node/index.js";

let closed = false;

init((env) => ({
    ...env,
    "env/v1/isClosedEnv": () => closed
}));

Object.assign(global, {
    setClosedEnv: (isClosed) => {
        closed = isClosed;
    }
});
