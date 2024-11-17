import { expect } from "chai";
import { dirSync } from "tmp";
import {
    Credentials,
    Group,
    VaultFormatA,
    VaultFormatB,
    VaultManager,
    VaultSource,
    setDefaultFormat
} from "../../dist/node/index.js";
import { PASSWORD, PATH, PORT, USERNAME, createServer } from "../resources/webdavServer.js";

const EMPTY_TRASH_EVERY = 100;
const ENTRIES_PER_GROUP = 25;
const GROUP_COUNT = 25;
const CHANGE_COUNT = 1000;
const LOG_EVERY = 250;
const SAVE_EVERY = 20;

function getAllChildEntryIDs(group) {
    return [
        ...group.getEntries().map((entry) => entry.id),
        ...group
            .getGroups()
            .reduce((output, group) => [...output, ...getAllChildEntryIDs(group)], [])
    ];
}

function getAllChildGroupIDs(group) {
    const groups = group.getGroups();
    return [
        ...groups.map((g) => g.id),
        ...groups.reduce((output, g) => [...output, ...getAllChildGroupIDs(g)], [])
    ];
}

function getAllChildIDs(group) {
    return {
        entries: getAllChildEntryIDs(group),
        groups: getAllChildGroupIDs(group)
    };
}

describe("consistency", function () {
    beforeEach(async function () {
        // Server
        this.dir = dirSync().name;
        this.server = createServer(this.dir, "basic");
        await this.server.start();
    });

    afterEach(async function () {
        await this.server.stop();
    });

    [
        ["Format A", VaultFormatA],
        ["Format B", VaultFormatB]
    ].forEach(([name, Format]) => {
        describe(`using: ${name}`, function () {
            beforeEach(async function () {
                setDefaultFormat(Format);
                this.vaultManager = new VaultManager({
                    autoUpdate: false
                });
                const webdavURL = `http://localhost:${PORT}${PATH}`;
                const creds = Credentials.fromDatasource(
                    {
                        endpoint: webdavURL,
                        password: PASSWORD,
                        path: "/test.bcup",
                        type: "webdav",
                        username: USERNAME
                    },
                    "test"
                );
                this.vaultSource = new VaultSource("Test", "webdav", await creds.toSecureString());
                await this.vaultManager.addSource(this.vaultSource);
                await this.vaultSource.unlock(Credentials.fromPassword("test"), {
                    initialiseRemote: true,
                    storeOfflineCopy: false
                });
                // Setup content
                this.groups = {};
                this.entries = {};
                this.entryGroup = {};
                this.groupGroup = {};
                for (let g = 0; g < GROUP_COUNT; g += 1) {
                    const group = this.vaultSource.vault.createGroup(`Group ${g + 1}`);
                    this.groups[group.id] = group;
                    this.groupGroup[group.id] = "0";
                    for (let e = 0; e < ENTRIES_PER_GROUP; e += 1) {
                        const entry = group.createEntry(`Entry ${e + 1} (Group ${g + 1})`);
                        this.entryGroup[entry.id] = group.id;
                        entry.setProperty("username", "Some User");
                        entry.setProperty("password", "Some pass!");
                        this.entries[entry.id] = entry;
                    }
                }
                await this.vaultSource.save();
            });

            afterEach(function () {
                setDefaultFormat();
            });

            it("remains in-tact over many changes", async function () {
                const trashGroup = this.vaultSource.vault.getTrashGroup();
                const getRandomEntry = () => {
                    const { entries: allTrashEntries } = getAllChildIDs(trashGroup);
                    const entryIDs = Object.keys(this.entries).filter(
                        (entryID) =>
                            this.entryGroup[entryID] !== null &&
                            allTrashEntries.includes(entryID) === false
                    );
                    const entryID = entryIDs[Math.floor(Math.random() * entryIDs.length)];
                    return this.entries[entryID];
                };
                const getRandomGroup = () => {
                    const { groups: allTrashGroups } = getAllChildIDs(trashGroup);
                    const groupIDs = Object.keys(this.groups).filter(
                        (groupID) =>
                            this.groupGroup[groupID] !== null &&
                            allTrashGroups.includes(groupID) === false
                    );
                    const groupID = groupIDs[Math.floor(Math.random() * groupIDs.length)];
                    return this.groups[groupID];
                };
                let optsBeforeSave = SAVE_EVERY;
                for (let i = 0; i < CHANGE_COUNT; i += 1) {
                    if (i % LOG_EVERY === 0) {
                        console.log(` -> ${Math.round((i / CHANGE_COUNT) * 100)}%`);
                    }
                    switch (i % 10) {
                        case 0: {
                            // Set property
                            const entry = getRandomEntry();
                            const properties = Object.keys(entry.getProperties());
                            const property =
                                properties[Math.floor(Math.random() * properties.length)];
                            entry.setProperty(
                                property,
                                `new value: ${Math.random()} ${Date.now()}`
                            );
                            break;
                        }
                        case 1: {
                            // Add property
                            const entry = getRandomEntry();
                            entry.setProperty(
                                `prop${Date.now()}`,
                                `first value: ${Math.random()} ${Date.now()}`
                            );
                            break;
                        }
                        case 2: {
                            // Delete/Restore entry
                            const entry = getRandomEntry();
                            if (entry.isInTrash()) {
                                // Restore
                                const group = getRandomGroup();
                                entry.moveToGroup(group);
                                this.entryGroup[entry.id] = group.id;
                            } else {
                                // Delete (trash)
                                entry.delete();
                                this.entryGroup[entry.id] = trashGroup.id;
                            }
                            break;
                        }
                        default: {
                            {
                                // Move entry
                                const entry = getRandomEntry();
                                const group = getRandomGroup();
                                entry.moveToGroup(group);
                                this.entryGroup[entry.id] = group.id;
                            }
                            {
                                // Move group
                                const group1 = getRandomGroup();
                                const group2 = getRandomGroup();
                                if (group1.id !== group2.id) {
                                    if (!group1.findGroupByID(group2.id)) {
                                        group1.moveTo(group2);
                                        this.groupGroup[group1.id] = group2.id;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    if (i % EMPTY_TRASH_EVERY === 0) {
                        const deleted = getAllChildIDs(trashGroup);
                        this.vaultSource.vault.emptyTrash();
                        for (const entryID of deleted.entries) {
                            this.entryGroup[entryID] = null;
                        }
                        for (const groupID of deleted.groups) {
                            this.groupGroup[groupID] = null;
                        }
                    }
                    optsBeforeSave -= 1;
                    if (optsBeforeSave <= 0) {
                        optsBeforeSave = SAVE_EVERY;
                        await this.vaultSource.save();
                    }
                }
                const { entries: currentTrashEntries, groups: currentTrashGroups } =
                    getAllChildIDs(trashGroup);
                for (const entryID in this.entries) {
                    const status = this.entryGroup[entryID];
                    if (status === null) {
                        expect(this.vaultSource.vault.findEntryByID(entryID)).to.equal(null);
                    } else if (status === trashGroup.id) {
                        expect(currentTrashEntries).to.contain(entryID);
                    } else {
                        const targetGroup = this.vaultSource.vault.findGroupByID(status);
                        expect(targetGroup.findEntryByID(entryID)).to.satisfy(
                            (e) => e && e.id === entryID,
                            "Group should contain entry"
                        );
                    }
                }
                for (const groupID in this.groups) {
                    const status = this.groupGroup[groupID];
                    if (status === null) {
                        expect(this.vaultSource.vault.findGroupByID(groupID)).to.equal(null);
                    } else if (status === trashGroup.id) {
                        expect(currentTrashGroups).to.contain(groupID);
                    } else if (status === "0") {
                        const rootGroups = this.vaultSource.vault.getGroups();
                        const target = rootGroups.find((rg) => rg.id === groupID);
                        expect(target).to.be.an.instanceOf(Group);
                    } else {
                        const targetGroup = this.vaultSource.vault.findGroupByID(status);
                        expect(targetGroup.findGroupByID(groupID)).to.satisfy(
                            (g) => g && g.id === groupID,
                            "Group should contain group"
                        );
                    }
                }
            }).timeout(5 * 60 * 1000);
        });
    });
});
