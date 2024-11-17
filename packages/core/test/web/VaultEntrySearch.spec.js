import { Group, MemoryStorageInterface, Vault, VaultEntrySearch } from "../../source/index.web.js";

describe("VaultEntrySearch", function () {
    beforeEach(function () {
        const vault = (this.vault = new Vault());
        const groupA = vault.createGroup("Email");
        groupA
            .createEntry("Personal Mail")
            .setProperty("username", "green.monkey@fastmail.com")
            .setProperty("password", "df98Sm2.109x{91")
            .setProperty("url", "https://fastmail.com");
        groupA
            .createEntry("Work")
            .setProperty("username", "j.crowley@gmov.edu.au")
            .setProperty("password", "#f05c.*skU3")
            .setProperty("URL", "gmov.edu.au/portal/auth");
        groupA
            .createEntry("Work logs")
            .setProperty("username", "j.crowley@gmov.edu.au")
            .setProperty("password", "#f05c.*skU3")
            .setProperty("URL", "https://logs.gmov.edu.au/sys30/atc.php");
        const groupB = vault.createGroup("Bank");
        groupB
            .createEntry("MyBank")
            .setProperty("username", "324654356346")
            .setProperty("PIN", "1234");
        groupB
            .createEntry("Insurance")
            .setProperty("username", "testing-user")
            .setProperty("URL", "http://test.org/portal-int/login.aspx");
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
            new VaultEntrySearch([this.vault]);
        }).to.not.throw();
    });

    describe("instance", function () {
        beforeEach(function () {
            this.storage = new MemoryStorageInterface();
            this.search = new VaultEntrySearch([this.vault], this.storage);
            return this.search.prepare();
        });

        describe("incrementScore", function () {
            it("writes correct first scores", async function () {
                await this.search.incrementScore("111", "222", "http://test.org/abc");
                await this.search.incrementScore("111", "222", "http://example.spec.xyz/");
                await this.search.incrementScore("111", "333", "http://a.b.com.au");
                const res = await this.storage.getValue("bcup_search_111");
                expect(JSON.parse(res)).to.deep.equal({
                    222: {
                        "test.org": 1,
                        "example.spec.xyz": 1
                    },
                    333: {
                        "a.b.com.au": 1
                    }
                });
            });

            it("writes correct incremented scores", async function () {
                await this.search.incrementScore("111", "222", "http://test.org/abc");
                await this.search.incrementScore("111", "222", "http://test.org/testing");
                const res = await this.storage.getValue("bcup_search_111");
                expect(JSON.parse(res)).to.deep.equal({
                    222: {
                        "test.org": 2
                    }
                });
            });
        });

        describe("searchByTerm", function () {
            it("finds results by term", function () {
                const results = this.search.searchByTerm("work").map((res) => res.properties.title);
                expect(results[0]).to.equal("Work");
                expect(results[1]).to.equal("Work logs");
                expect(results[2]).to.equal("Wordpress");
            });

            it("excludes trash entries", function () {
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

            it("excludes trash entries", function () {
                const results = this.search.searchByURL("ebay.com");
                expect(results).to.have.lengthOf(0);
            });

            it("finds multiple similar results", function () {
                const results = this.search.searchByURL("https://gmov.edu.au/portal/");
                expect(results).to.have.lengthOf(2);
                expect(results[0].properties.title).to.equal("Work");
                expect(results[1].properties.title).to.equal("Work logs");
            });

            it("supports ordering", function () {
                const [entry] = this.vault.findEntriesByProperty("title", "Work logs");
                return this.storage
                    .setValue(
                        `bcup_search_${this.vault.id}`,
                        JSON.stringify({
                            [entry.id]: {
                                "gmov.edu.au": 1
                            }
                        })
                    )
                    .then(() => this.search.prepare())
                    .then(() => {
                        const results = this.search.searchByURL("https://gmov.edu.au/portal/");
                        expect(results).to.have.lengthOf(2);
                        expect(results[0].properties.title).to.equal("Work logs");
                        expect(results[1].properties.title).to.equal("Work");
                    });
            });
        });
    });
});
