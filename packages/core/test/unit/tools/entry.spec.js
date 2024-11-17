import { expect } from "chai";
import { Vault, getEntryPath } from "../../../dist/node/index.js";

describe("tools/entry", function () {
    describe("getEntryPath", function () {
        beforeEach(function () {
            const vault = new Vault();
            this.group1 = vault.createGroup("test");
            this.group2 = this.group1.createGroup("child");
            this.entry = this.group2.createEntry("Bank");
            this.entry
                .setProperty("username", "u12345")
                .setProperty("password", "passw0rd")
                .setProperty("URL", "https://bank.com")
                .setAttribute("BC_TEST", "test");
        });

        it("returns the correct path", function () {
            expect(getEntryPath(this.entry)).to.deep.equal([this.group1.id, this.group2.id]);
        });
    });
});
