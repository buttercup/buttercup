import { expect } from "chai";
import {
    Entry,
    Group,
    Vault,
    VaultFormatA,
    VaultFormatB,
    consumeVaultFacade,
    createEntryFacade,
    createFieldDescriptor,
    createGroupFacade,
    createVaultFacade
} from "../../../dist/node/index.js";

describe("Vault facades", function () {
    [
        [VaultFormatA, "A"],
        [VaultFormatB, "B"]
    ].forEach(([Format, formatName]) => {
        describe(`Format: ${formatName}`, function () {
            beforeEach(function () {
                this.vault = new Vault(Format);
                this.vault.setAttribute("ATTR_1", "one").setAttribute("ATTR_2", "two");
                const topGroup = (this.topGroup = this.vault.createGroup("top"));
                const bottomGroup = (this.bottomGroup = topGroup
                    .createGroup("one")
                    .createGroup("two"));
                this.otherGroup = this.vault.createGroup("other");
                topGroup.createGroup("three");
                this.entryA = topGroup
                    .createEntry("Entry A")
                    .setProperty("username", "user@example.com")
                    .setProperty("password", "passw0rd")
                    .setAttribute("test_attr", "1234")
                    .setAttribute("test_attr_2", "5678");
                this.entryB = bottomGroup
                    .createEntry("Entry B")
                    .setProperty("username", "user2@example.com")
                    .setProperty("password", "pa55w0rd");
            });

            describe("consumeVaultFacade", function () {
                it("supports deleting entries", function () {
                    const facade = createVaultFacade(this.vault);
                    const entryAID = this.entryA.id;
                    const targetEntryIndex = facade.entries.findIndex(
                        (entryFacade) => entryFacade.id === entryAID
                    );
                    expect(this.vault.findEntryByID(entryAID)).to.be.an.instanceOf(Entry);
                    facade.entries.splice(targetEntryIndex, 1);
                    consumeVaultFacade(this.vault, facade);
                    expect(this.vault.findEntryByID(entryAID)).to.be.null;
                });

                it("supports moving entries", function () {
                    const facade = createVaultFacade(this.vault);
                    const targetEntryIndex = facade.entries.findIndex(
                        (entryFacade) => entryFacade.id === this.entryA.id
                    );
                    facade.entries[targetEntryIndex].parentID = this.bottomGroup.id;
                    expect(this.vault.findEntryByID(this.entryA.id).getGroup().id).to.equal(
                        this.topGroup.id
                    );
                    consumeVaultFacade(this.vault, facade);
                    expect(this.vault.findEntryByID(this.entryA.id).getGroup().id).to.equal(
                        this.bottomGroup.id
                    );
                });

                it("supports adding entries", function () {
                    const facade = createVaultFacade(this.vault);
                    const entryFacade = createEntryFacade();
                    entryFacade.fields.find((field) => field.property === "title").value =
                        "Test Entry";
                    entryFacade.parentID = this.topGroup.id;
                    facade.entries.push(entryFacade);
                    consumeVaultFacade(this.vault, facade);
                    expect(
                        this.vault.findEntriesByProperty("title", "Test Entry")[0]
                    ).to.be.an.instanceOf(Entry);
                });

                it("supports adding entries of other types", function () {
                    const facade = createVaultFacade(this.vault);
                    const entryFacade = createEntryFacade(null, { type: "note" });
                    entryFacade.fields.find((field) => field.property === "title").value =
                        "Test Entry";
                    entryFacade.parentID = this.topGroup.id;
                    facade.entries.push(entryFacade);
                    consumeVaultFacade(this.vault, facade);
                    const entry = this.vault.findEntriesByProperty("title", "Test Entry")[0];
                    expect(entry.getAttribute(Entry.Attributes.FacadeType)).to.equal("note");
                });

                it("supports deleting groups", function () {
                    const facade = createVaultFacade(this.vault);
                    const topGroupID = this.topGroup.id;
                    const bottomGroupID = this.bottomGroup.id;
                    const groupIndex = facade.groups.findIndex(
                        (groupFacade) => groupFacade.id === topGroupID
                    );
                    facade.groups.splice(groupIndex, 1);
                    expect(this.vault.findGroupByID(topGroupID)).to.be.an.instanceOf(Group);
                    consumeVaultFacade(this.vault, facade);
                    expect(this.vault.findGroupByID(topGroupID)).to.be.null;
                    expect(this.vault.findGroupByID(bottomGroupID)).to.be.null;
                });

                it("supports moving groups", function () {
                    const facade = createVaultFacade(this.vault);
                    const otherGroupID = this.otherGroup.id;
                    const bottomGroupID = this.bottomGroup.id;
                    facade.groups.find((groupFacade) => groupFacade.id === bottomGroupID).parentID =
                        otherGroupID;
                    consumeVaultFacade(this.vault, facade);
                    const otherGroupChildren = this.vault.findGroupByID(otherGroupID).getGroups();
                    expect(otherGroupChildren[0].id).to.equal(bottomGroupID);
                });

                it("supports moving groups to root", function () {
                    const facade = createVaultFacade(this.vault);
                    const bottomGroupID = this.bottomGroup.id;
                    facade.groups.find((groupFacade) => groupFacade.id === bottomGroupID).parentID =
                        "0";
                    consumeVaultFacade(this.vault, facade);
                    expect(
                        this.vault.getGroups().find((g) => g.id === bottomGroupID)
                    ).to.be.an.instanceOf(Group);
                });

                describe("using ID placeholders", function () {
                    beforeEach(function () {
                        const facade = createVaultFacade(this.vault);
                        const newGroup1 = createGroupFacade();
                        newGroup1.title = "New 1";
                        newGroup1.id = "1";
                        const newGroup2 = createGroupFacade(null, "1");
                        newGroup2.title = "New 2";
                        newGroup2.id = "2";
                        facade.groups.push(newGroup2, newGroup1);
                        const newEntry = createEntryFacade();
                        newEntry.id = "3";
                        newEntry.parentID = "2";
                        const field = createFieldDescriptor(null, "Title", "property", "title");
                        field.value = "Test entry 3";
                        newEntry.fields.push(field);
                        facade.entries.push(newEntry);
                        consumeVaultFacade(this.vault, facade);
                    });

                    it("can create new items with relationships", function () {
                        const [parentGroup] = this.vault.findGroupsByTitle("New 1");
                        expect(parentGroup).to.be.an.instanceOf(Group);
                        const [childGroup] = parentGroup.getGroups();
                        expect(childGroup).to.be.an.instanceOf(Group);
                        const [entry] = childGroup.getEntries();
                        expect(entry).to.be.an.instanceOf(Entry);
                        expect(entry.getProperty("title")).to.equal("Test entry 3");
                    });
                });

                describe("in merge mode", function () {
                    beforeEach(function () {
                        const newVault = new Vault();
                        newVault
                            .createGroup("merged")
                            .createEntry("merged")
                            .setProperty("username", "merge")
                            .setProperty("password", "merge");
                        const newFacade = createVaultFacade(newVault);
                        consumeVaultFacade(this.vault, newFacade, {
                            mergeMode: true
                        });
                    });

                    it("can merge-in new items", function () {
                        const [mergeGroup] = this.vault.findGroupsByTitle("merged");
                        expect(mergeGroup).to.be.an.instanceOf(Group);
                        const [mergeEntry] = this.vault.findEntriesByProperty("title", "merged");
                        expect(mergeEntry).to.be.an.instanceOf(Entry);
                    });

                    it("retains existing items", function () {
                        const [existingGroup] = this.vault.findGroupsByTitle("three");
                        expect(existingGroup).to.be.an.instanceOf(Group);
                        const [existingEntry] = this.vault.findEntriesByProperty(
                            "title",
                            "Entry A"
                        );
                        expect(existingEntry).to.be.an.instanceOf(Entry);
                    });
                });
            });

            describe("createVaultFacade", function () {
                beforeEach(function () {
                    const trash = this.vault.createGroup("Trash");
                    trash.createGroup("Trash sub");
                    this.trashEntry = trash.createEntry("Trash entry");
                    trash.setAttribute(Group.Attribute.Role, "trash");
                });

                it("outputs expected groups", function () {
                    const facade = createVaultFacade(this.vault);
                    const groupNames = facade.groups.map((group) => group.title);
                    expect(groupNames).to.contain("top");
                    expect(groupNames).to.contain("two");
                    expect(groupNames).to.contain("Trash");
                    expect(groupNames).to.contain("Trash sub");
                });

                it("does not output trash group when configured", function () {
                    const facade = createVaultFacade(this.vault, {
                        includeTrash: false
                    });
                    const groupNames = facade.groups.map((group) => group.title);
                    expect(groupNames).to.contain("top");
                    expect(groupNames).to.contain("two");
                    expect(groupNames).to.not.contain("Trash");
                    expect(groupNames).to.not.contain("Trash sub");
                });

                it("outputs expected entries", function () {
                    const facade = createVaultFacade(this.vault);
                    const entryIDs = facade.entries.map((entry) => entry.id);
                    expect(entryIDs).to.include(this.entryA.id);
                    expect(entryIDs).to.include(this.entryB.id);
                    expect(entryIDs).to.include(this.trashEntry.id);
                });

                it("does not output entries in trash when configured", function () {
                    const facade = createVaultFacade(this.vault, {
                        includeTrash: false
                    });
                    const entryIDs = facade.entries.map((entry) => entry.id);
                    expect(entryIDs).to.include(this.entryA.id);
                    expect(entryIDs).to.include(this.entryB.id);
                    expect(entryIDs).to.not.include(this.trashEntry.id);
                });
            });
        });
    });
});
