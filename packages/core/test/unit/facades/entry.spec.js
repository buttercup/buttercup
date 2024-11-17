import { expect } from "chai";
import {
    Entry,
    EntryPropertyType,
    EntryType,
    Vault,
    VaultFormatB,
    createEntryFacade,
    createEntryFromFacade,
    createFieldDescriptor,
    createVaultFacade,
    getEntryFacadePath,
    setDefaultFormat
} from "../../../dist/node/index.js";

describe("facades/entry", function () {
    describe("createEntryFacade", function () {
        beforeEach(function () {
            setDefaultFormat(VaultFormatB);
            const vault = new Vault();
            this.entry = vault.createGroup("test").createEntry("Bank");
            this.entry
                .setProperty("username", "u12345")
                .setProperty("password", "passw0rd")
                .setProperty("URL", "https://bank.com")
                .setAttribute("BC_TEST", "test");
        });

        afterEach(function () {
            setDefaultFormat();
        });

        it("outputs the correct facade type", function () {
            const { type: type1 } = createEntryFacade(this.entry);
            expect(type1).to.equal("login");
            this.entry.setAttribute(Entry.Attributes.FacadeType, "website");
            const { type: type2 } = createEntryFacade(this.entry);
            expect(type2).to.equal("website");
        });

        it("supports overriding the entry type", function () {
            this.entry.setAttribute(Entry.Attributes.FacadeType, "website");
            const { type } = createEntryFacade(this.entry, { type: "login" });
            expect(type).to.equal("login");
        });

        it("throws if the parameter is not an Entry instance", function () {
            expect(() => {
                createEntryFacade(new Vault());
            }).to.throw(/not an Entry/i);
        });

        it("throws if entry facade type is not recognised", function () {
            this.entry.setAttribute(Entry.Attributes.FacadeType, "chicken");
            expect(() => {
                createEntryFacade(this.entry);
            }).to.throw(/No.+found for type/i);
        });

        it("outputs attributes", function () {
            const { fields } = createEntryFacade(this.entry);
            const attr = fields.find((field) => field.property === "BC_TEST");
            expect(attr).to.be.an("object");
            expect(attr).to.have.property("propertyType", "attribute");
            expect(attr).to.have.property("value", "test");
            expect(attr).to.have.property("valueType", null);
        });

        it("outputs 0 changes when nothing overridden", function () {
            const { _changes } = createEntryFacade(this.entry);
            expect(_changes).to.have.lengthOf(0);
        });

        it("outputs changes when something overridden", function () {
            this.entry.setProperty("username", "second");
            const { _changes } = createEntryFacade(this.entry);
            expect(_changes).to.have.length.above(0);
        });
    });

    describe("createEntryFromFacade", function () {
        beforeEach(function () {
            const vault = new Vault();
            this.group = vault.createGroup("test");
            this.entry = createEntryFromFacade(this.group, {
                type: EntryType.Website,
                fields: [
                    {
                        ...createFieldDescriptor(
                            null,
                            "Title",
                            EntryPropertyType.Property,
                            "title"
                        ),
                        value: "Test"
                    },
                    {
                        ...createFieldDescriptor(
                            null,
                            "Username",
                            EntryPropertyType.Property,
                            "username"
                        ),
                        value: "user"
                    }
                ]
            });
        });

        it("creates new entries", function () {
            expect(this.entry).to.be.an.instanceOf(Entry);
        });

        it("sets correct type", function () {
            expect(this.entry.getType()).to.equal(EntryType.Website);
        });

        it("sets properties correctly", function () {
            expect(this.entry.getProperty("title")).to.equal("Test");
            expect(this.entry.getProperty("username")).to.equal("user");
        });
    });

    describe("getEntryFacadePath", function () {
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
            this.vaultFacade = createVaultFacade(vault);
        });

        it("returns the correct path", function () {
            expect(getEntryFacadePath(this.entry.id, this.vaultFacade)).to.deep.equal([
                this.group1.id,
                this.group2.id
            ]);
        });
    });
});
