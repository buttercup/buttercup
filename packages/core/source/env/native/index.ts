import { getCryptoResources } from "./crypto.js";
import { getCompressionResources as getV1CompressionResources } from "./compression.v1.js";
import { getCompressionResources as getV2CompressionResources } from "./compression.v2.js";
import { getEnvironmentResources } from "./environment.js";
import { getNetResources } from "./net.js";
import { getRNGResources } from "./rng.js";
import { getEncodingResources } from "./encoding.js";
import { AppEnv } from "../core/appEnv.js";
import { AppEnvMapper } from "../appEnv.js";

export function applyNativeConfiguration(appEnv: AppEnv, map: AppEnvMapper) {
    appEnv.setProperties(
        map({
            ...getCryptoResources(),
            ...getV1CompressionResources(),
            ...getV2CompressionResources(),
            ...getEnvironmentResources(),
            ...getNetResources(),
            ...getRNGResources(),
            ...getEncodingResources()
        })
    );
}
