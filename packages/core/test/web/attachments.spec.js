import {
    AttachmentManager,
    Credentials,
    MemoryStorageInterface,
    VaultManager,
    VaultSource
} from "../../source/index.web.js";

import IMAGE_DATA from "../resources/attachments/image.png";

// compare ArrayBuffers
function arrayBuffersAreEqual(a, b) {
    return dataViewsAreEqual(new DataView(a), new DataView(b));
}

function concatArrayBuffers(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
}

// compare DataViews
function dataViewsAreEqual(a, b) {
    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i++) {
        if (a.getUint8(i) !== b.getUint8(i)) return false;
    }
    return true;
}

describe("AttachmentManager", function () {
    beforeEach(async function () {
        this.vaultManager = new VaultManager({
            cacheStorage: new MemoryStorageInterface(),
            sourceStorage: new MemoryStorageInterface()
        });
        this.sourceCredentials = Credentials.fromDatasource(
            {
                type: "memory",
                property: "test-vault"
            },
            "test"
        );
        const credsStr = await this.sourceCredentials.toSecureString();
        this.source = new VaultSource("Attachments test", "memory", credsStr);
        await this.vaultManager.addSource(this.source);
        await this.source.unlock(this.sourceCredentials, { initialiseRemote: true });
        this.group = this.source.vault.createGroup("test");
        this.entry = this.group.createEntry("Account").setProperty("username", "user@test.com");
    });

    it("supports attachments", async function () {
        expect(this.source.supportsAttachments()).to.be.true;
    });

    it("can add attachments", async function () {
        const attachmentID = AttachmentManager.newAttachmentID();
        const nowDate = new Date();
        await this.source.attachmentManager.setAttachment(
            this.entry,
            attachmentID,
            IMAGE_DATA,
            "image.png",
            "image/png",
            nowDate
        );
        const attachmentDataRead = await this.source.attachmentManager.getAttachment(
            this.entry,
            attachmentID
        );
        expect(arrayBuffersAreEqual(IMAGE_DATA, attachmentDataRead)).to.be.true;
        const details = await this.source.attachmentManager.getAttachmentDetails(
            this.entry,
            attachmentID
        );
        expect(details).to.deep.equal({
            id: attachmentID,
            name: "image.png",
            type: "image/png",
            sizeOriginal: 439968,
            sizeEncrypted: 440185,
            created: nowDate.toUTCString(),
            updated: nowDate.toUTCString()
        });
    });

    describe("with an attachment added", function () {
        beforeEach(async function () {
            this.attachmentData = IMAGE_DATA;
            this.attachmentID = AttachmentManager.newAttachmentID();
            this.attachmentID2 = AttachmentManager.newAttachmentID();
            await this.source.attachmentManager.setAttachment(
                this.entry,
                this.attachmentID,
                this.attachmentData,
                "image.png",
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
            await this.source.attachmentManager.removeAttachment(this.entry, this.attachmentID);
            try {
                await this.source.attachmentManager.getAttachment(this.entry, this.attachmentID);
            } catch (err) {
                expect(err).to.match(/Attachment not available/i);
            }
        });

        it("supports listing attachments", async function () {
            const attachments = await this.source.attachmentManager.listAttachments(this.entry);
            const files = attachments.map((item) => item.name);
            expect(files).to.have.a.lengthOf(2);
            expect(files).to.contain("image.png");
            expect(files).to.contain("test.png");
        });

        it("fails to add an attachment if there's not enough free space", async function () {
            const getAvailableStorage = (this.source._datasource.getAvailableStorage = sinon
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
                    "image/png"
                );
            } catch (err) {
                expect(err).to.match(/Not enough space/i);
                expect(err).to.match(/needed = 440185 B/i);
                expect(err).to.match(/available = 1000 B/i);
            }
            expect(getAvailableStorage.callCount).to.equal(1);
            expect(this.source._datasource.putAttachment.notCalled).to.be.true;
        });

        it("fails to update an attachment if there's not enough free space", async function () {
            const getAvailableStorage = (this.source._datasource.getAvailableStorage = sinon
                .stub()
                .callsFake(() => Promise.resolve(1000)));
            sinon.spy(this.source._datasource, "putAttachment");
            const newBuffer = concatArrayBuffers(this.attachmentData, new ArrayBuffer(2500));
            try {
                await this.source.attachmentManager.setAttachment(
                    this.entry,
                    this.attachmentID,
                    newBuffer,
                    "image.png",
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
