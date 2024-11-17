import { expect } from "chai";
import { getSharedAppEnv } from "../../../dist/node/index.js";

describe("appEnv", function () {
    describe("compression", function () {
        describe("v1", function () {
            const compress = getSharedAppEnv().getProperty("compression/v1/compressText");
            const decompress = getSharedAppEnv().getProperty("compression/v1/decompressText");

            it("can compress and decompress text", function () {
                const compressed = compress("this is\nsome text! ");
                const decompressed = decompress(compressed);
                expect(decompressed).to.equal("this is\nsome text! ");
            });

            it("can compress and decompress special characters", function () {
                const compressed = compress("ატრიბუტი\nความคุ้มค่า");
                const decompressed = decompress(compressed);
                expect(decompressed).to.equal("ატრიბუტი\nความคุ้มค่า");
            });
        });

        describe("v2", function () {
            const compress = getSharedAppEnv().getProperty("compression/v2/compressText");
            const decompress = getSharedAppEnv().getProperty("compression/v2/decompressText");

            it("can compress and decompress text", async function () {
                const compressed = await compress("this is\nsome text! ");
                const decompressed = await decompress(compressed);
                expect(decompressed).to.equal("this is\nsome text! ");
            });

            it("can compress and decompress special characters", async function () {
                const compressed = await compress("ატრიბუტი\nความคุ้มค่า");
                const decompressed = await decompress(compressed);
                expect(decompressed).to.equal("ატრიბუტი\nความคุ้มค่า");
            });
        });
    });
});
