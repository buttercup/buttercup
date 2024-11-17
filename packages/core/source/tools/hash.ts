import hashJS from "hash.js";

export function hashHistory(history) {
    return hashJS.sha256().update(history.join("\n")).digest("hex");
}
