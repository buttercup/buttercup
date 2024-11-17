import { expect } from "chai";
import { fileSync } from "tmp";
import { Credentials, FileDatasource, Group, Vault, VaultFormatB } from "../../dist/node/index.js";

describe("Format B", function () {
    beforeEach(function () {
        this.vault = Vault.createWithDefaults(VaultFormatB);
    });

    it("creates groups correctly", function () {
        const groupA = this.vault.createGroup("Parent");
        expect(groupA).to.be.an.instanceOf(Group);
        expect(groupA.getTitle()).to.equal("Parent");
    });

    it("sets and gets attributes correctly", function () {
        this.vault.setAttribute("test", "abc123");
        expect(this.vault.getAttribute("test")).to.equal("abc123");
        this.vault.setAttribute("another", "");
        expect(this.vault.getAttribute()).to.deep.equal({
            test: "abc123",
            another: ""
        });
    });

    it("can find groups", function () {
        const groupA = this.vault.createGroup("Group A (one)");
        const groupB = this.vault.createGroup("Group B (one)");
        this.vault.createGroup("Group C (two)");
        const groups = this.vault.findGroupsByTitle(/one/);
        expect(groups).to.have.lengthOf(2);
        expect(groups.find((g) => g.id === groupA.id)).to.be.an.instanceOf(Group);
        expect(groups.find((g) => g.id === groupB.id)).to.be.an.instanceOf(Group);
    });

    it("can save and load to a file", async function () {
        const tempFile = fileSync().name;
        const creds = Credentials.fromDatasource(
            {
                type: "file",
                path: tempFile
            },
            "test"
        );
        const fds = new FileDatasource(creds);
        await fds.save(this.vault.format.history, Credentials.fromPassword("test"));
        const { Format, history } = await fds.load(Credentials.fromPassword("test"));
        const vault = Vault.createFromHistory(history, Format);
        expect(Format).to.equal(VaultFormatB);
        expect(vault.id).to.equal(this.vault.id);
    });

    describe("Group", function () {
        beforeEach(function () {
            this.parent = this.vault.createGroup("Parent");
            this.child = this.parent.createGroup("Child");
            this.child.createEntry("Email");
            this.child.createEntry("Bank");
        });

        it("can get child groups", function () {
            expect(this.parent.getGroups()).to.have.lengthOf(1);
            expect(this.parent.getGroups()[0].id).to.equal(this.child.id);
        });

        it("get find deep entries", function () {
            const entries = this.parent.findEntriesByProperty("title", /mail/i);
            expect(entries).to.have.lengthOf(1);
            expect(entries[0].getProperty("title")).to.equal("Email");
        });
    });

    describe("Entry", function () {
        beforeEach(function () {
            this.trash = this.vault.getTrashGroup();
            this.group1 = this.vault.createGroup("Root");
            this.group2 = this.vault.createGroup("Other");
            this.entry1 = this.group1
                .createEntry("My Bank")
                .setProperty("username", "u93840293")
                .setProperty("password", "ipnt2np4g-0")
                .setProperty("Url", "https://my.bank.org/abc-123/login.php");
            this.entry2 = this.group1
                .createEntry("Work email")
                .setProperty("username", "j.ericsson@test.org")
                .setProperty("password", "mo3m;,23903j9")
                .setProperty("URL", "email.work.org");
        });

        it("gets correct properties", function () {
            expect(this.entry1.getProperty()).to.deep.equal({
                title: "My Bank",
                username: "u93840293",
                password: "ipnt2np4g-0",
                Url: "https://my.bank.org/abc-123/login.php"
            });
        });

        it("can be moved", function () {
            this.entry1.moveToGroup(this.group2);
            expect(this.group1.getEntries()).to.have.lengthOf(1);
            expect(this.group2.getEntries()).to.have.lengthOf(1);
        });

        it("can be deleted", function () {
            expect(this.trash.getEntries()).to.have.lengthOf(0);
            this.entry1.delete();
            expect(this.group1.getEntries()).to.have.lengthOf(1);
            expect(this.trash.getEntries()).to.have.lengthOf(1);
        });
    });
});
