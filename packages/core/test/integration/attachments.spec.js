import { basename, dirname, join, resolve } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import sinon from "sinon";
import { dirSync } from "tmp";
import {
    AttachmentManager,
    Credentials,
    MemoryStorageInterface,
    Vault,
    VaultFormatA,
    VaultFormatB,
    VaultManager,
    VaultSource,
    setDefaultFormat
} from "../../dist/node/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGE_PATH = resolve(__dirname, "../resources/attachments/image.png");

describe("AttachmentManager", function () {
    [
        ["Format A", VaultFormatA],
        ["Format B", VaultFormatB]
    ].forEach(([format, Format]) => {
        describe(`using ${format}`, function () {
            beforeEach(function () {
                setDefaultFormat(Format);
            });

            afterEach(function () {
                setDefaultFormat();
            });

            [
                {
                    type: "memory",
                    property: "test-vault"
                },
                {
                    type: "file",
                    path: join(dirSync().name, "vault.bcup")
                }
            ].forEach((datasourceConfig) => {
                describe(`using datasource type: ${datasourceConfig.type}`, function () {
                    beforeEach(async function () {
                        this.vaultManager = new VaultManager({
                            cacheStorage: new MemoryStorageInterface(),
                            sourceStorage: new MemoryStorageInterface()
                        });
                        this.sourceCredentials = Credentials.fromDatasource(
                            datasourceConfig,
                            "test"
                        );
                        const credsStr = await this.sourceCredentials.toSecureString();
                        this.source = new VaultSource(
                            "Attachments test",
                            datasourceConfig.type,
                            credsStr
                        );
                        await this.vaultManager.addSource(this.source);
                        await this.source.unlock(this.sourceCredentials, {
                            initialiseRemote: true
                        });
                        this.group = this.source.vault.createGroup("test");
                        this.entry = this.group
                            .createEntry("Account")
                            .setProperty("username", "user@test.com");
                    });

                    it("uses the right format", function () {
                        expect(this.source.vault.format.getFormat()).to.equal(Format);
                    });

                    it("supports attachments", async function () {
                        expect(this.source.supportsAttachments()).to.be.true;
                    });

                    it("can add attachments", async function () {
                        const attachmentData = await readFile(IMAGE_PATH);
                        const attachmentID = AttachmentManager.newAttachmentID();
                        const fileInfo = await stat(IMAGE_PATH);
                        const nowDate = new Date();
                        await this.source.attachmentManager.setAttachment(
                            this.entry,
                            attachmentID,
                            attachmentData,
                            basename(IMAGE_PATH),
                            "image/png",
                            nowDate
                        );
                        const attachmentDataRead =
                            await this.source.attachmentManager.getAttachment(
                                this.entry,
                                attachmentID
                            );
                        expect(attachmentData.equals(attachmentDataRead)).to.be.true;
                        const details = await this.source.attachmentManager.getAttachmentDetails(
                            this.entry,
                            attachmentID
                        );
                        expect(details).to.deep.equal({
                            id: attachmentID,
                            name: "image.png",
                            type: "image/png",
                            sizeOriginal: 439968,
                            sizeEncrypted: 440189,
                            created: nowDate.toUTCString(),
                            updated: nowDate.toUTCString()
                        });
                        expect(details.sizeOriginal).to.equal(fileInfo.size);
                    });

                    describe("attachments key", function () {
                        async function generateAttachment() {
                            const attachmentData = await readFile(IMAGE_PATH);
                            const attachmentID = AttachmentManager.newAttachmentID();
                            const fileInfo = await stat(IMAGE_PATH);
                            const nowDate = new Date();
                            await this.source.attachmentManager.setAttachment(
                                this.entry,
                                attachmentID,
                                attachmentData,
                                basename(IMAGE_PATH),
                                "image/png",
                                nowDate
                            );
                        }

                        it("sets a new attachment key", async function () {
                            let key = this.source.vault.getAttribute(
                                Vault.Attribute.AttachmentsKey
                            );
                            expect(key).to.be.undefined;
                            await generateAttachment.call(this);
                            key = this.source.vault.getAttribute(Vault.Attribute.AttachmentsKey);
                            expect(key).to.have.length.above(0);
                        });

                        it("uses the same key each time", async function () {
                            await generateAttachment.call(this);
                            const key1 = this.source.vault.getAttribute(
                                Vault.Attribute.AttachmentsKey
                            );
                            await generateAttachment.call(this);
                            const key2 = this.source.vault.getAttribute(
                                Vault.Attribute.AttachmentsKey
                            );
                            expect(key1).to.equal(key2);
                        });
                    });

                    describe("with an attachment added", function () {
                        beforeEach(async function () {
                            this.attachmentData = await readFile(IMAGE_PATH);
                            this.attachmentID = AttachmentManager.newAttachmentID();
                            this.attachmentID2 = AttachmentManager.newAttachmentID();
                            this.fileInfo = await stat(IMAGE_PATH);
                            await this.source.attachmentManager.setAttachment(
                                this.entry,
                                this.attachmentID,
                                this.attachmentData,
                                basename(IMAGE_PATH),
                                "image/png"
                            );
                            await this.source.attachmentManager.setAttachment(
                                this.entry,
                                this.attachmentID2,
                                this.attachmentData,
                                "test.png",
                                "image/png"
                            );
                        });

                        it("supports removing attachments", async function () {
                            await this.source.attachmentManager.removeAttachment(
                                this.entry,
                                this.attachmentID
                            );
                            try {
                                await this.source.attachmentManager.getAttachment(
                                    this.entry,
                                    this.attachmentID
                                );
                            } catch (err) {
                                expect(err).to.match(/Attachment not available/i);
                            }
                        });

                        it("supports listing attachments", async function () {
                            const attachments = await this.source.attachmentManager.listAttachments(
                                this.entry
                            );
                            const files = attachments.map((item) => item.name);
                            expect(files).to.have.a.lengthOf(2);
                            expect(files).to.contain("image.png");
                            expect(files).to.contain("test.png");
                        });

                        it("fails to add an attachment if there's not enough free space", async function () {
                            const getAvailableStorage =
                                (this.source._datasource.getAvailableStorage = sinon
                                    .stub()
                                    .callsFake(() => Promise.resolve(1000)));
                            sinon.spy(this.source._datasource, "putAttachment");
                            const newID = AttachmentManager.newAttachmentID();
                            try {
                                await this.source.attachmentManager.setAttachment(
                                    this.entry,
                                    newID,
                                    this.attachmentData,
                                    "third.png",
                                    "image/png",
                                    this.fileInfo.size
                                );
                            } catch (err) {
                                expect(err).to.match(/Not enough space/i);
                                expect(err).to.match(/needed = 440189 B/i);
                                expect(err).to.match(/available = 1000 B/i);
                            }
                            expect(getAvailableStorage.callCount).to.equal(1);
                            expect(this.source._datasource.putAttachment.notCalled).to.be.true;
                        });

                        it("fails to update an attachment if there's not enough free space", async function () {
                            const getAvailableStorage =
                                (this.source._datasource.getAvailableStorage = sinon
                                    .stub()
                                    .callsFake(() => Promise.resolve(1000)));
                            sinon.spy(this.source._datasource, "putAttachment");
                            const newData = Buffer.concat([
                                this.attachmentData,
                                Buffer.alloc(2500)
                            ]);
                            try {
                                await this.source.attachmentManager.setAttachment(
                                    this.entry,
                                    this.attachmentID,
                                    newData,
                                    basename(IMAGE_PATH),
                                    "image/png"
                                );
                            } catch (err) {
                                expect(err).to.match(/Not enough space/i);
                                expect(err).to.match(/needed = 2\d{3} B/i);
                                expect(err).to.match(/available = 1000 B/i);
                            }
                            expect(getAvailableStorage.callCount).to.equal(1);
                            expect(this.source._datasource.putAttachment.notCalled).to.be.true;
                        });
                    });
                });
            });
        });
    });
});
