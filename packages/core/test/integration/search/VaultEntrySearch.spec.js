import { expect } from "chai";
import { EntryType, MemoryStorageInterface, VaultEntrySearch } from "../../../dist/node/index.js";
import { createSampleVault } from "./helpers.js";

describe("VaultEntrySearch", function () {
    beforeEach(function () {
        this.vault = createSampleVault();
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

            it("returns resulting entry type", function () {
                const [res] = this.search.searchByTerm("Personal Mail");
                expect(res).to.have.property("entryType", EntryType.Website);
            });

            it("returns results including entry group IDs", function () {
                const [res] = this.search.searchByTerm("Personal Mail");
                expect(res).to.have.property("groupID").that.is.a("string");
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
