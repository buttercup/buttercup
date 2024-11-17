import { expect } from "chai";
import {
    Entry,
    EntryChangeType,
    EntryPropertyValueType,
    Group,
    Vault,
    VaultFormatA,
    VaultFormatB,
    VaultPermission,
    setDefaultFormat
} from "../../../dist/node/index.js";

describe("core/Entry", function () {
    [
        [VaultFormatA, "A"],
        [VaultFormatB, "B"]
    ].forEach(([Format, formatName]) => {
        describe(`Using: Format ${formatName}`, function () {
            beforeEach(function () {
                setDefaultFormat(Format);
                this.vault = Vault.createWithDefaults();
                this.group = this.vault.createGroup("test");
                this.otherGroup = this.vault.createGroup("second");
                this.entry = this.group.createEntry("entry");
                this.entry.setAttribute(Entry.Attributes.Tags, "one,two,three");
                this.entry.setAttribute("attrib", "ok");
                this.entry.setAttribute("attrib2", "also-ok");
                this.entry.setProperty("metakey", "metaval");
                this.entry.setProperty("username", "tony");
                this.entry.setProperty("username", "anthony");
                this.entry.setProperty("password", "passw0rd");
                this.entry.setProperty("passphrase", "hunter22");
                this.entry.setProperty("url", "test.com");
                this.entry.setProperty("login-url", "test.com/login");
            });

            afterEach(function () {
                setDefaultFormat();
            });

            describe("get:id", function () {
                it("returns the correct ID", function () {
                    expect(this.entry.id).to.equal(this.entry._source.id);
                });
            });

            describe("get:permissions", function () {
                it("returns all permissions by default", function () {
                    expect(this.entry.permissions).to.contain(VaultPermission.Manage);
                    expect(this.entry.permissions).to.contain(VaultPermission.Read);
                    expect(this.entry.permissions).to.contain(VaultPermission.Write);
                });
            });

            describe("addTags", function () {
                it("adds tags", function () {
                    this.entry.addTags("four", "five");
                    expect(this.entry.getTags()).to.deep.equal([
                        "one",
                        "two",
                        "three",
                        "four",
                        "five"
                    ]);
                });

                it("throws adding tags with invalid characters", function () {
                    expect(() => {
                        this.entry.addTags("ok", "!");
                    }).to.throw(/Invalid format/i);
                });

                it("throws adding empty", function () {
                    expect(() => {
                        this.entry.addTags("ok", "");
                    }).to.throw(/Invalid format/i);
                });
            });

            describe("delete", function () {
                it("moves itself to the Trash group", function () {
                    const trash = this.vault.getTrashGroup();
                    expect(trash.getEntries()).to.have.lengthOf(0);
                    this.entry.delete();
                    expect(trash.getEntries()).to.have.lengthOf(1);
                    expect(trash.getEntries()[0].getProperty("title")).to.equal("entry");
                });

                it("deletes itself permanently when forced", function () {
                    const trash = this.vault.getTrashGroup();
                    expect(trash.getEntries()).to.have.lengthOf(0);
                    this.entry.delete(/* skip */ true);
                    expect(trash.getEntries()).to.have.lengthOf(0);
                    expect(this.entry._westley).to.be.undefined;
                });
            });

            describe("deleteAttribute", function () {
                it("deletes attributes", function () {
                    expect(this.entry.getAttribute("attrib")).to.equal("ok");
                    this.entry.deleteAttribute("attrib");
                    expect(this.entry.getAttribute("attrib")).to.be.undefined;
                });
            });

            describe("deleteProperty", function () {
                it("deletes properties", function () {
                    this.entry.deleteProperty("username");
                    expect(this.entry.getProperty("username")).to.be.undefined;
                });
            });

            describe("getAttribute", function () {
                it("returns attributes", function () {
                    expect(this.entry.getAttribute("attrib")).to.equal("ok");
                });

                it("returns undefined if the attribute doesn't exist", function () {
                    expect(this.entry.getAttribute("nothere")).to.be.undefined;
                });

                it("returns an object if no parameter is provided", function () {
                    expect(this.entry.getAttribute()).to.deep.include({
                        attrib: "ok",
                        attrib2: "also-ok"
                    });
                });
            });

            describe("getChanges", function () {
                it("contains property sets", function () {
                    expect(this.entry.getChanges()).to.have.length.above(0);
                });

                it("contains property deletions", function () {
                    this.entry.deleteProperty("username");
                    const changes = this.entry
                        .getChanges()
                        .filter(
                            (item) =>
                                item.type === EntryChangeType.Deleted &&
                                item.property === "username"
                        );
                    expect(changes).to.have.lengthOf(1);
                    expect(changes[0]).to.have.property("value").that.is.null;
                });

                it("contains property creations", function () {
                    this.entry.deleteProperty("username");
                    const changes = this.entry
                        .getChanges()
                        .filter(
                            (item) =>
                                item.type === EntryChangeType.Created &&
                                item.property === "username"
                        );
                    expect(changes).to.have.lengthOf(1);
                    expect(changes[0]).to.have.property("value", "tony");
                });
            });

            describe("getGroup", function () {
                it("returns parent group", function () {
                    expect(this.entry.getGroup()).to.be.an.instanceof(Group);
                    expect(this.entry.getGroup().id).to.equal(this.group.id);
                });
            });

            describe("getProperty", function () {
                it("returns property values", function () {
                    expect(this.entry.getProperty("title")).to.equal("entry");
                    expect(this.entry.getProperty("username")).to.equal("anthony");
                    expect(this.entry.getProperty("password")).to.equal("passw0rd");
                });

                it("returns an object if no parameter provided", function () {
                    expect(this.entry.getProperty()).to.deep.equal({
                        "title": "entry",
                        "username": "anthony",
                        "password": "passw0rd",
                        "passphrase": "hunter22",
                        "metakey": "metaval",
                        "url": "test.com",
                        "login-url": "test.com/login"
                    });
                });

                it("returns undefined if the property doesn't exist", function () {
                    expect(this.entry.getProperty("age")).to.be.undefined;
                });
            });

            describe("getPropertyValueType", function () {
                it("gets value types", function () {
                    const property = "username";
                    expect(this.entry.getPropertyValueType(property)).to.equal(
                        EntryPropertyValueType.Text
                    );
                    this.entry.setPropertyValueType(property, EntryPropertyValueType.Password);
                    expect(this.entry.getPropertyValueType(property)).to.equal(
                        EntryPropertyValueType.Password
                    );
                });
            });

            describe("getProperties", function () {
                it("returns exact property values", function () {
                    expect(this.entry.getProperties(/title/)).to.deep.equal({ title: "entry" });
                    expect(this.entry.getProperties(/username/)).to.deep.equal({
                        username: "anthony"
                    });
                    expect(this.entry.getProperties(/password/)).to.deep.equal({
                        password: "passw0rd"
                    });
                });

                it("returns properties based on regexp", function () {
                    expect(this.entry.getProperties(/pass.*/)).to.deep.equal({
                        password: "passw0rd",
                        passphrase: "hunter22"
                    });
                });

                it("compares strings as strings", function () {
                    expect(this.entry.getProperties("password")).to.deep.equal({
                        password: "passw0rd"
                    });
                });

                it("returns an object with no parameter provided", function () {
                    expect(this.entry.getProperties()).to.deep.equal({
                        "title": "entry",
                        "username": "anthony",
                        "password": "passw0rd",
                        "passphrase": "hunter22",
                        "metakey": "metaval",
                        "url": "test.com",
                        "login-url": "test.com/login"
                    });
                });

                it("returns an empty array when no matches are found", function () {
                    expect(this.entry.getProperties(/non-existent-property/)).to.deep.equal({});
                });
            });

            describe("getTags", function () {
                it("returns an array of strings", function () {
                    expect(this.entry.getTags()).to.deep.equal(["one", "two", "three"]);
                });
            });

            describe("getURLs", function () {
                it("returns an array of URLs", function () {
                    const urls = this.entry.getURLs();
                    expect(urls).to.deep.equal(["test.com", "test.com/login"]);
                });
            });

            describe("isInTrash", function () {
                it("returns correctly", function () {
                    expect(this.entry.isInTrash()).to.be.false;
                    this.entry.delete();
                    expect(this.entry.isInTrash()).to.be.true;
                });
            });

            describe("moveToGroup", function () {
                it("moves entry to another group", function () {
                    expect(this.group.getEntries()).to.have.lengthOf(1);
                    expect(this.otherGroup.getEntries()).to.have.lengthOf(0);
                    this.entry.moveToGroup(this.otherGroup);
                    expect(this.group.getEntries()).to.have.lengthOf(0);
                    expect(this.otherGroup.getEntries()).to.have.lengthOf(1);
                });
            });

            describe("removeTags", function () {
                it("removes tags", function () {
                    this.entry.removeTags("one", "two");
                    expect(this.entry.getTags()).to.deep.equal(["three"]);
                });
            });

            describe("setAttribute", function () {
                it("sets attributes", function () {
                    this.entry.setAttribute("one", "two");
                    expect(this.entry.getAttribute("one")).to.equal("two");
                    this.entry.setAttribute("one", "three");
                    expect(this.entry.getAttribute("one")).to.equal("three");
                });
            });

            describe("setProperty", function () {
                it("sets properties", function () {
                    this.entry.setProperty("username", "two");
                    expect(this.entry.getProperty("username")).to.equal("two");
                    this.entry.setProperty("username", "three");
                    expect(this.entry.getProperty("username")).to.equal("three");
                });

                it("sets complex property names", function () {
                    this.entry.setProperty("-", "one");
                    this.entry.setProperty("©öoł", "two");
                    expect(this.entry.getProperty("-")).to.equal("one");
                    expect(this.entry.getProperty("©öoł")).to.equal("two");
                });
            });

            describe("setPropertyValueType", function () {
                it("sets value types", function () {
                    const property = "custom";
                    this.entry.setProperty(property, "abc123");
                    expect(this.entry.getPropertyValueType(property)).to.equal(
                        EntryPropertyValueType.Text
                    );
                    this.entry.setPropertyValueType(property, EntryPropertyValueType.Password);
                    expect(this.entry.getPropertyValueType(property)).to.equal(
                        EntryPropertyValueType.Password
                    );
                });
            });
        });
    });
});
