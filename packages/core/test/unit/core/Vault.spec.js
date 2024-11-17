import { expect } from "chai";
import sinon from "sinon";
import { Group, Vault, VaultFormatA, setDefaultFormat } from "../../../dist/node/index.js";

describe("core/Vault", function () {
    it("can be instantiated", function () {
        expect(() => {
            new Vault();
        }).to.not.throw();
    });

    it("should be empty", function () {
        const vault = new Vault();
        expect(vault.getGroups()).to.have.lengthOf(0);
    });

    describe("static:createFromHistory", function () {
        beforeEach(function () {
            setDefaultFormat(VaultFormatA);
            this.history = [
                "aid 95d8023d-f1a0-4bda-9ac3-a39b6613293c",
                "cmm utf8+base64:QnV0dGVyY3VwIGFyY2hpdmUgY3JlYXRlZCAoMjAxOC02LTQp",
                "fmt utf8+base64:YnV0dGVyY3VwL2E=",
                "saa utf8+base64:YXR0cg== utf8+base64:dGVzdA==",
                "pad 15485e19-7f0c-4a28-a74c-6c00a5cc0418",
                "cgr 0 f35882ed-cee3-4144-b8fa-b3f8038175be",
                "tgr f35882ed-cee3-4144-b8fa-b3f8038175be utf8+base64:bWFpbg==",
                "pad 84115b0d-b7bc-43aa-ba9d-3ae5db2e71d7"
            ];
        });

        afterEach(function () {
            setDefaultFormat();
        });

        it("creates an vault", function () {
            const vault = Vault.createFromHistory(this.history);
            expect(vault).to.be.an.instanceof(Vault);
        });

        it("sets the correct ID", function () {
            const vault = Vault.createFromHistory(this.history);
            expect(vault.id).to.equal("95d8023d-f1a0-4bda-9ac3-a39b6613293c");
        });
    });

    describe("static:createWithDefaults", function () {
        it("populates the vault with a 'General' group", function () {
            const vault = Vault.createWithDefaults();
            const generalGroup = vault.getGroups().find((group) => group.getTitle() === "General");
            expect(generalGroup).to.be.an.instanceof(Group);
        });

        it("populates the vault with a 'Trash' group", function () {
            const vault = Vault.createWithDefaults();
            const trashGroup = vault.getGroups().find((group) => group.getTitle() === "Trash");
            expect(trashGroup).to.be.an.instanceof(Group);
        });
    });

    describe("createGroup", function () {
        beforeEach(function () {
            this.vault = new Vault();
        });

        it("returns a group", function () {
            const group = this.vault.createGroup("new");
            expect(group).to.be.an.instanceof(Group);
        });

        it("adds a group to the vault", function () {
            const group = this.vault.createGroup("new");
            expect(this.vault.getGroups().map((group) => group.id)).to.contain(group.id);
        });
    });

    describe("deleteAttribute", function () {
        beforeEach(function () {
            this.vault = new Vault();
            this.vault.setAttribute("test", "value");
        });

        it("deletes attributes", function () {
            expect(this.vault.getAttribute("test")).to.equal("value");
            this.vault.deleteAttribute("test");
            expect(this.vault.getAttribute("test")).to.be.undefined;
        });
    });

    describe("emptyTrash", function () {
        beforeEach(function () {
            this.vault = new Vault();
            this.group = this.vault.createGroup("fake-trash");
            this.group.createGroup("sub1");
            this.group.createGroup("sub2");
            this.group.createEntry("entry");
            sinon.stub(this.vault, "getTrashGroup").returns(this.group);
        });

        it("empties all groups in the trash", function () {
            expect(this.group.getGroups()).to.have.length.above(0);
            this.vault.emptyTrash();
            expect(this.group.getGroups()).to.have.lengthOf(0);
        });

        it("empties all entries in the trash", function () {
            expect(this.group.getEntries()).to.have.length.above(0);
            this.vault.emptyTrash();
            expect(this.group.getEntries()).to.have.lengthOf(0);
        });
    });

    describe("findEntryByID", function () {
        beforeEach(function () {
            this.vault = new Vault();
            const group = this.vault.createGroup("test");
            this.entry1 = group.createEntry("one");
            this.entry2 = group.createEntry("two");
        });

        it("gets the correct entry", function () {
            const foundEntry = this.vault.findEntryByID(this.entry1.id);
            expect(foundEntry.id).to.equal(this.entry1.id);
        });
    });

    describe("findEntriesByTag", function () {
        beforeEach(function () {
            this.vault = new Vault();
            const group = this.vault.createGroup("test");
            this.entry1 = group.createEntry("one").addTags("alpha", "new", "metal_material");
            this.entry2 = group.createEntry("two").addTags("beta", "new", "metal_finish");
            this.entry3 = group.createEntry("three").addTags("gamma", "old");
        });

        describe("using exact matching", function () {
            it("returns correct results for single-matching tag", function () {
                const foundEntries = this.vault.findEntriesByTag("alpha");
                expect(foundEntries).to.have.lengthOf(1);
                expect(foundEntries[0].id).to.equal(this.entry1.id);
            });

            it("returns correct results for multi-matching tag", function () {
                const foundEntries = this.vault.findEntriesByTag("new");
                expect(foundEntries).to.have.lengthOf(2);
                expect(foundEntries[0].id).to.equal(this.entry1.id);
                expect(foundEntries[1].id).to.equal(this.entry2.id);
            });
        });

        describe("using partial matching", function () {
            it("returns correct results for matching prefix", function () {
                const foundEntries = this.vault.findEntriesByTag("metal_", false);
                expect(foundEntries).to.have.lengthOf(2);
                expect(foundEntries[0].id).to.equal(this.entry1.id);
                expect(foundEntries[1].id).to.equal(this.entry2.id);
            });
        });
    });

    describe("findGroupByID", function () {
        beforeEach(function () {
            this.vault = new Vault();
            this.top = this.vault.createGroup("top");
            this.bottom = this.top.createGroup("bottom");
        });

        it("gets the correct group", function () {
            const found = this.vault.findGroupByID(this.bottom.id);
            expect(found.id).to.equal(this.bottom.id);
        });

        it("returns null if not found", function () {
            const found = this.vault.findGroupByID("");
            expect(found).to.be.null;
        });
    });

    describe("findGroupsByTitle", function () {
        beforeEach(function () {
            this.vault = new Vault();
            this.top = this.vault.createGroup("top");
            this.bottom = this.top.createGroup("bottom");
        });

        it("gets the correct group", function () {
            const found = this.vault.findGroupsByTitle("bottom");
            expect(found).to.have.a.lengthOf(1);
            expect(found[0].id).to.equal(this.bottom.id);
        });

        it("returns an empty array if not found", function () {
            const found = this.vault.findGroupsByTitle("not-real");
            expect(found).to.have.a.lengthOf(0);
        });
    });

    describe("getAttribute", function () {
        beforeEach(function () {
            this.vault = new Vault();
            this.vault.setAttribute("testing", "string");
        });

        it("returns the correct value", function () {
            expect(this.vault.getAttribute("testing")).to.equal("string");
        });

        it("returns undefined if the attribute doesn't exist", function () {
            expect(this.vault.getAttribute("nope")).to.be.undefined;
        });

        it("returns an object if no parameter is provided", function () {
            expect(this.vault.getAttribute()).to.deep.equal({
                testing: "string"
            });
        });
    });

    describe("getGroups", function () {
        beforeEach(function () {
            this.vault = new Vault();
            this.group = this.vault.createGroup("test");
        });

        it("returns an array", function () {
            expect(this.vault.getGroups()).to.be.an("array");
        });

        it("contains expected groups", function () {
            expect(this.vault.getGroups().map((g) => g.id)).to.contain(this.group.id);
        });
    });

    describe("getTrashGroup", function () {
        it("returns null when no trash", function () {
            const vault = new Vault();
            expect(vault.getTrashGroup()).to.be.null;
        });

        it("returns the trash group", function () {
            const vault = Vault.createWithDefaults();
            expect(vault.getTrashGroup()).to.be.an.instanceof(Group);
        });
    });

    describe("setAttribute", function () {
        beforeEach(function () {
            this.vault = new Vault();
        });

        it("sets attributes", function () {
            this.vault.setAttribute("testing", "123");
            expect(this.vault.getAttribute("testing")).to.equal("123");
        });
    });
});
