import { expect } from "chai";
import {
    base64ToBytes,
    bytesToBase64,
    decodeBase64String,
    encodeBase64String
} from "../../../dist/node/index.js";

const BASE64 = "VGVzdDogdGV4dCE=";
const RAW = "Test: text!";
const RAW_BYTES = new Uint8Array([84, 101, 115, 116, 58, 32, 116, 101, 120, 116, 33]);

function typedArraysAreEqual(a, b) {
    if (a.byteLength !== b.byteLength) return false;
    return a.every((val, i) => val === b[i]);
}

describe("tools/encoding", function () {
    describe("base64ToBytes", function () {
        it("converts base64 to a Uint8Array", function () {
            const bytes = base64ToBytes(BASE64);
            expect(Object.prototype.toString.call(bytes)).to.equal("[object Uint8Array]");
        });

        it("outputs correct bytes", function () {
            const bytes = base64ToBytes(BASE64);
            expect(typedArraysAreEqual(bytes, RAW_BYTES)).to.be.true;
        });
    });

    describe("bytesToBase64", function () {
        beforeEach(function () {
            const encoder = new TextEncoder();
            this.bytes = encoder.encode(RAW);
        });

        it("converts a Uint8Array to base64", function () {
            expect(bytesToBase64(this.bytes)).to.equal(BASE64);
        });
    });

    describe("decodeBase64String", function () {
        it("decodes base64", function () {
            expect(decodeBase64String(BASE64)).to.equal(RAW);
        });
    });

    describe("encodeBase64String", function () {
        it("encodes base64", function () {
            expect(encodeBase64String(RAW)).to.equal(BASE64);
        });
    });
});
