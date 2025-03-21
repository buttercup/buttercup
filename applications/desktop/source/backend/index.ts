import { app } from "electron";
import { BUTTERCUP_PROTOCOL } from "@buttercup/interop";
import { focusLastWindowOrOpenNew } from "./services/windows.js";
import { initialise as initialiseStorage } from "./services/storage/index.js";
import { getEnvironment } from "./library/environment.js";
import { initialise as initialiseIPC } from "./ipc/index.js";
import { initialise as initialiseCore } from "./services/buttercup/index.js";

async function initialise() {
    const environment = getEnvironment();

    await app.whenReady();
    await initialiseStorage(environment);
    await initialiseCore();
    initialiseIPC();
    await focusLastWindowOrOpenNew();
}

// **
// ** Activation
// **

const lock = app.requestSingleInstanceLock();
if (!lock) {
    app.quit();
}

app.on("window-all-closed", () => {
    // @todo: Handle this?
});

app.on("activate", async () => {
    await focusLastWindowOrOpenNew();
});

// **
// ** App protocol handling
// **

app.on("second-instance", async (event, args) => {
    await focusLastWindowOrOpenNew();
    // Protocol URL for Linux/Windows
    const protocolURL = args.find((arg) => arg.startsWith(BUTTERCUP_PROTOCOL));
    if (protocolURL) {
        // handleProtocolCall(protocolURL);
    }
});
app.on("open-url", (e, url) => {
    // Protocol URL for MacOS
    if (url.startsWith(BUTTERCUP_PROTOCOL)) {
        // handleProtocolCall(url);
    }
});

// **
// ** Boot
// **

initialise().catch((err) => {
    console.error(err);
    app.quit();
});
