import { expect } from "chai";
import randomString from "crypto-random-string";
import { MemoryStorageInterface, Vault, VaultEntrySearch } from "../../../dist/node/index.js";

const ENTRY_COUNT_MAX = 12;
const ENTRY_COUNT_MIN = 5;
const ENTRY_PROP_COUNT = 5;
const GROUP_COUNT_SUB = 2;
const GROUP_COUNT_TOP = 20;
const GROUPS_DEPTH = 3;

function buildVault() {
    const vault = Vault.createWithDefaults();
    (function buildLevel(level = 1, parentGroup = null) {
        const groupCount =
            level === GROUPS_DEPTH ? 0 : level === 1 ? GROUP_COUNT_TOP : GROUP_COUNT_SUB;
        const entryCount = parentGroup
            ? ENTRY_COUNT_MIN + Math.floor((ENTRY_COUNT_MAX - ENTRY_COUNT_MIN) * Math.random())
            : 0;
        const groupParent = parentGroup ? parentGroup : vault;
        for (let g = 0; g < groupCount; g += 1) {
            const group = groupParent.createGroup(`Test Group ${g}`);
            if (level < GROUPS_DEPTH) {
                buildLevel(level + 1, group);
            }
            for (let e = 0; e < entryCount; e += 1) {
                const entry = group.createEntry(`Test Entry ${g}/${e}`);
                entry.setProperty("username", randomString({ length: 8, type: "distinguishable" }));
                entry.setProperty("password", randomString({ length: 20 }));
                entry.setProperty(
                    "url",
                    `https://test.com/${randomString({ length: 30, type: "url-safe" })}`
                );
                for (let p = 0; p < ENTRY_PROP_COUNT; p += 1) {
                    const prop = randomString({ length: 8, type: "alphanumeric" });
                    entry.setProperty(prop, randomString({ length: 16, type: "alphanumeric" }));
                    entry.setProperty(prop, randomString({ length: 16, type: "alphanumeric" }));
                    entry.setProperty(prop, randomString({ length: 16, type: "alphanumeric" }));
                }
            }
        }
    })();
    return vault;
}

describe("VaultEntrySearch", function () {
    beforeEach(function () {
        this.vault = buildVault();
        this.storage = new MemoryStorageInterface();
        this.search = new VaultEntrySearch([this.vault], this.storage);
    });

    it("should prepare in under 500 milliseconds", async function () {
        const start = Date.now();
        await this.search.prepare();
        const duration = Date.now() - start;
        expect(duration).to.be.below(500);
    });

    describe("searchByTerm", function () {
        beforeEach(async function () {
            await this.search.prepare();
        });

        it("should complete in under 100 milliseconds", function () {
            const start = Date.now();
            this.search.searchByTerm(randomString({ length: 16, type: "alphanumeric" }));
            const duration = Date.now() - start;
            expect(duration).to.be.below(100);
        });
    });

    describe("searchByURL", function () {
        beforeEach(async function () {
            await this.search.prepare();
            this.url = `https://test.com/${randomString({ length: 30, type: "url-safe" })}`;
        });

        it("should complete in under 100 milliseconds", function () {
            const start = Date.now();
            this.search.searchByURL(this.url);
            const duration = Date.now() - start;
            expect(duration).to.be.below(100);
        });
    });
});
