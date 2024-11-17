import { expect } from "chai";
import {
    Entry,
    Group,
    Vault,
    VaultFormatA,
    VaultPermission,
    generateUUID,
    setDefaultFormat
} from "../../../dist/node/index.js";

describe("core/Group", function () {
    beforeEach(function () {
        setDefaultFormat(VaultFormatA);
        this.vault = Vault.createWithDefaults();
        this.group = this.vault.createGroup("test");
        this.group.setAttribute("abc", "123");
        this.group.setAttribute("another", "attribute");
        this.entry1 = this.group.createEntry("entry1");
        this.entry2 = this.group.createEntry("entry2");
    });

    afterEach(function () {
        setDefaultFormat();
    });

    describe("get:id", function () {
        it("returns the correct ID", function () {
            expect(this.group.id).to.equal(this.group._source.id);
        });
    });

    describe("get:permissions", function () {
        it("returns all permissions by default", function () {
            expect(this.group.permissions).to.contain(VaultPermission.Manage);
            expect(this.group.permissions).to.contain(VaultPermission.Read);
            expect(this.group.permissions).to.contain(VaultPermission.Write);
        });
    });

    describe("createNew", function () {
        it("creates a new group at the root", function () {
            const group = Group.createNew(this.vault);
            expect(group).to.be.an.instanceOf(Group);
            expect(group.getParentGroup()).to.be.null;
        });

        it("creates a new group under another", function () {
            const group = Group.createNew(this.vault, this.group.id);
            expect(group).to.be.an.instanceOf(Group);
            expect(group.getParentGroup().id).to.equal(this.group.id);
        });

        it("creates a new group with a custom ID", function () {
            const id = generateUUID();
            const group = Group.createNew(this.vault, this.group.id, id);
            expect(group).to.be.an.instanceOf(Group);
            expect(group.id).to.equal(id);
        });
    });

    describe("instance", function () {
        describe("createEntry", function () {
            it("returns an Entry instance", function () {
                const entry = this.group.createEntry("testing");
                expect(entry).to.be.an.instanceof(Entry);
            });

            it("adds an entry to the group", function () {
                const entry = this.group.createEntry("testing");
                expect(this.group.getEntries().map((e) => e.id)).to.contain(entry.id);
            });

            it("can create title-less entries", function () {
                const entry = this.group.createEntry();
                expect(entry.getProperty("title")).to.be.undefined;
            });
        });

        describe("createGroup", function () {
            it("returns an Group instance", function () {
                const group = this.group.createGroup("testing");
                expect(group).to.be.an.instanceof(Group);
            });

            it("adds a group to the group", function () {
                const group = this.group.createGroup("testing");
                expect(this.group.getGroups().map((g) => g.id)).to.contain(group.id);
            });

            it("can create groups with the correct default title", function () {
                const group = this.group.createGroup();
                expect(group.getTitle()).to.equal("New group");
            });
        });

        describe("delete", function () {
            it("sends the group to the trash", function () {
                const trash = this.vault.getTrashGroup();
                expect(trash.getGroups().map((g) => g.id)).to.not.contain(this.group.id);
                const deleted = this.group.delete();
                expect(trash.getGroups().map((g) => g.id)).to.contain(this.group.id);
                expect(deleted).to.be.false;
            });

            it("can force-delete the group", function () {
                const trash = this.vault.getTrashGroup();
                const groupID = this.group.id;
                expect(trash.getGroups().map((g) => g.id)).to.not.contain(groupID);
                const deleted = this.group.delete(/* skip */ true);
                expect(trash.getGroups().map((g) => g.id)).to.not.contain(groupID);
                expect(deleted).to.be.true;
            });

            it("throws if group is trash", function () {
                const trash = this.vault.getTrashGroup();
                expect(() => {
                    trash.delete();
                }).to.throw(/cannot be deleted/i);
            });
        });

        describe("deleteAttribute", function () {
            it("deletes attributes", function () {
                expect(this.group.getAttribute("abc")).to.equal("123");
                this.group.deleteAttribute("abc");
                expect(this.group.getAttribute("abc")).to.be.undefined;
            });

            it("returns the Group instance", function () {
                const output = this.group.deleteAttribute("abc");
                expect(output).to.equal(this.group);
            });
        });

        describe("findEntryByID", function () {
            beforeEach(function () {
                this.entry1 = this.group.createEntry("one");
                this.entry2 = this.group.createEntry("two");
            });

            it("gets the correct entry", function () {
                const foundEntry = this.group.findEntryByID(this.entry1.id);
                expect(foundEntry.id).to.equal(this.entry1.id);
            });
        });

        describe("findGroupByID", function () {
            beforeEach(function () {
                this.top = this.group.createGroup("top");
                this.bottom = this.top.createGroup("bottom");
            });

            it("gets the correct group", function () {
                const found = this.group.findGroupByID(this.bottom.id);
                expect(found.id).to.equal(this.bottom.id);
            });

            it("returns null if not found", function () {
                const found = this.group.findGroupByID("");
                expect(found).to.be.null;
            });
        });

        describe("getAttribute", function () {
            it("returns the attribute value", function () {
                expect(this.group.getAttribute("abc")).to.equal("123");
            });

            it("returns undefined if the attribute doesn't exist", function () {
                expect(this.group.getAttribute("def")).to.be.undefined;
            });

            it("returns all attributes when no name provided", function () {
                expect(this.group.getAttribute()).to.deep.equal({
                    another: "attribute",
                    abc: "123"
                });
            });
        });

        describe("getEntries", function () {
            it("returns an array", function () {
                expect(this.group.getEntries()).to.be.an("array");
            });

            it("contains expected entries", function () {
                const entries = this.group.getEntries().map((e) => e.id);
                expect(entries).to.contain(this.entry1.id);
                expect(entries).to.contain(this.entry2.id);
            });
        });

        describe("getParentGroup", function () {
            it("returns null if parent is the vault", function () {
                expect(this.group.getParentGroup()).to.be.null;
            });

            it("returns parent group", function () {
                const sub = this.group.createGroup("sub");
                expect(sub.getParentGroup().id).to.equal(this.group.id);
            });
        });

        describe("getGroups", function () {
            it("returns an array", function () {
                expect(this.group.getGroups()).to.be.an("array");
            });

            it("contains expected groups", function () {
                const gid1 = this.group.createGroup("one").id;
                const gid2 = this.group.createGroup("two").id;
                expect(this.group.getGroups().map((g) => g.id)).to.contain(gid1);
                expect(this.group.getGroups().map((g) => g.id)).to.contain(gid2);
            });
        });

        describe("getTitle", function () {
            it("returns the title", function () {
                expect(this.group.getTitle()).to.equal("test");
            });

            it("returns the correct string for untitled group", function () {
                const group = this.group.createGroup();
                expect(group.getTitle()).to.equal("New group");
            });
        });

        describe("isInTrash", function () {
            it("returns false when not in trash", function () {
                expect(this.group.isInTrash()).to.be.false;
            });

            it("returns true when in trash", function () {
                this.group.delete();
                expect(this.group.isInTrash()).to.be.true;
            });
        });

        describe("isTrash", function () {
            it("returns false when not trash", function () {
                expect(this.group.isTrash()).to.be.false;
            });

            it("returns true when group is trash", function () {
                const trash = this.vault.getTrashGroup();
                expect(trash.isTrash()).to.be.true;
            });
        });

        describe("moveTo", function () {
            it("moves a group into another", function () {
                const parent1 = this.vault.createGroup("parent1");
                const parent2 = this.vault.createGroup("parent2");
                const child = parent1.createGroup("child");
                child.moveTo(parent2);
                expect(parent2.getGroups().map((g) => g.id)).to.contain(child.id);
            });

            it("moves a group into another vault", function () {
                const vault2 = new Vault();
                const gid = this.group.id;
                this.group.moveTo(vault2);
                expect(this.vault.findGroupByID(gid)).to.be.null;
                expect(vault2.findGroupByID(gid)).to.not.be.null;
            });
        });

        describe("setAttribute", function () {
            it("sets attribute values", function () {
                this.group.setAttribute("testing", "000");
                expect(this.group.getAttribute("testing")).to.equal("000");
            });
        });

        describe("setTitle", function () {
            it("sets the group title", function () {
                this.group.setTitle("a title");
                expect(this.group.getTitle()).to.equal("a title");
            });
        });
    });
});
