import { expect } from "chai";
import {
    Entry,
    EntryType,
    Group,
    MemoryStorageInterface,
    Vault,
    VaultFacadeEntrySearch,
    createVaultFacade
} from "../../../dist/node/index.js";

describe("VaultFacadeEntrySearch", function () {
    beforeEach(function () {
        const vault = (this.vault = new Vault());
        const groupA = vault.createGroup("Email");
        groupA
            .createEntry("Personal Mail")
            .setProperty("username", "green.monkey@fastmail.com")
            .setProperty("password", "df98Sm2.109x{91")
            .setProperty("url", "https://fastmail.com")
            .setAttribute(Entry.Attributes.FacadeType, EntryType.Website);
        groupA
            .createEntry("Work")
            .setProperty("username", "j.crowley@gmov.edu.au")
            .setProperty("password", "#f05c.*skU3")
            .setProperty("URL", "gmov.edu.au/portal/auth")
            .addTags("job");
        groupA
            .createEntry("Work logs")
            .setProperty("username", "j.crowley@gmov.edu.au")
            .setProperty("password", "#f05c.*skU3")
            .setProperty("URL", "https://logs.gmov.edu.au/sys30/atc.php")
            .addTags("job");
        const groupB = vault.createGroup("Bank");
        groupB
            .createEntry("MyBank")
            .setProperty("username", "324654356346")
            .setProperty("PIN", "1234")
            .setAttribute(Entry.Attributes.FacadeType, EntryType.Login)
            .addTags("finance", "banking");
        groupB
            .createEntry("Insurance")
            .setProperty("username", "testing-user")
            .setProperty("URL", "http://test.org/portal-int/login.aspx")
            .addTags("finance");
        const groupC = vault.createGroup("General");
        groupC
            .createEntry("Clipart")
            .setProperty("username", "gmonkey123")
            .setProperty("password", "test93045")
            .setProperty("Url", "clipart.com");
        groupC
            .createEntry("Wordpress")
            .setProperty("username", "gmonkey1234")
            .setProperty("password", "passw0rd")
            .setProperty("Url", "https://wordpress.com/")
            .setProperty("Login URL", "https://wordpress.com/account/login.php");
        const trashGroup = vault.createGroup("Trash");
        trashGroup
            .createEntry("Ebay")
            .setProperty("username", "gmk123@hotmail.com")
            .setProperty("password", "passw0rd")
            .setProperty("Url", "https://ebay.com/");
        trashGroup.setAttribute(Group.Attribute.Role, "trash");
    });

    it("can be instantiated", function () {
        expect(() => {
            new VaultFacadeEntrySearch([createVaultFacade(this.vault)]);
        }).to.not.throw();
    });

    describe("instance", function () {
        beforeEach(function () {
            this.storage = new MemoryStorageInterface();
            this.search = new VaultFacadeEntrySearch([createVaultFacade(this.vault)], this.storage);
            return this.search.prepare();
        });

        describe("searchByTerm", function () {
            it("finds results by term", function () {
                const results = this.search.searchByTerm("work").map((res) => res.properties.title);
                expect(results[0]).to.equal("Work");
                expect(results[1]).to.equal("Work logs");
                expect(results[2]).to.equal("Wordpress");
            });

            it("returns results using a single tag, no search", function () {
                const results = this.search.searchByTerm("#job").map((res) => res.properties.title);
                expect(results).to.deep.equal(["Work", "Work logs"]);
            });

            it("returns results using multiple tags, no search", function () {
                const results = this.search
                    .searchByTerm("#finance #banking")
                    .map((res) => res.properties.title);
                expect(results).to.deep.equal(["MyBank"]);
            });

            it("returns results using tags and search", function () {
                const results = this.search
                    .searchByTerm("#job logs")
                    .map((res) => res.properties.title);
                expect(results).to.deep.equal(["Work logs"]);
            });

            it.skip("excludes trash entries", function () {
                const results = this.search.searchByTerm("ebay");
                expect(results).to.have.lengthOf(0);
            });
        });

        describe("searchByURL", function () {
            it("finds results by URL", function () {
                const results = this.search.searchByURL("https://wordpress.com/homepage/test/org");
                expect(results).to.have.length.above(0);
                expect(results[0]).to.have.nested.property("properties.title", "Wordpress");
            });

            it.skip("excludes trash entries", function () {
                const results = this.search.searchByURL("ebay.com");
                expect(results).to.have.lengthOf(0);
            });
        });
    });
});
