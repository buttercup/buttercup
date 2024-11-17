import { expect } from "chai";
import {
    EntryPropertyValueType,
    Vault,
    VaultFormatA,
    VaultFormatB,
    consumeEntryFacade,
    createEntryFacade,
    getEntryPropertyValueType,
    setEntryFacadePropertyValueType,
    setEntryPropertyValueType
} from "../../../dist/node/index.js";

describe("Entry facades", function () {
    [
        [VaultFormatA, "A"],
        [VaultFormatB, "B"]
    ].forEach(([Format, formatName]) => {
        describe(`Format: ${formatName}`, function () {
            beforeEach(function () {
                this.vault = new Vault(Format);
                this.group = this.vault.createGroup("group");
                this.entry = this.group
                    .createEntry("Entry A")
                    .setProperty("username", "user@example.com")
                    .setProperty("password", "passw0rd")
                    .setAttribute("test_attr", "1234")
                    .setAttribute("test_attr_2", "5678");
                setEntryPropertyValueType(this.entry, "password", EntryPropertyValueType.Password);
                this.entryFacade = createEntryFacade(this.entry);
            });

            it("sets the correct value type when changing via property field", function () {
                setEntryFacadePropertyValueType(
                    this.entryFacade,
                    "password",
                    EntryPropertyValueType.Note
                );
                consumeEntryFacade(this.entry, this.entryFacade);
                expect(getEntryPropertyValueType(this.entry, "password")).to.equal(
                    EntryPropertyValueType.Note
                );
            });
        });
    });
});
