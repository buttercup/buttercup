import { v4 as uuid } from "uuid";
import { Credentials, MemoryDatasource, Vault } from "../../source/index.web.js";

function arrayBuffersAreEqual(a, b) {
    return dataViewsAreEqual(new DataView(a), new DataView(b));
}

function dataViewsAreEqual(a, b) {
    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i++) {
        if (a.getUint8(i) !== b.getUint8(i)) return false;
    }
    return true;
}

function stringToArrayBuffer(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

describe("MemoryDatasource", function () {
    beforeEach(function () {
        this.vault = Vault.createWithDefaults();
        this.vault
            .findGroupsByTitle("General")[0]
            .createEntry("Test")
            .setProperty("username", "test");
        this.mds = new MemoryDatasource(
            Credentials.fromDatasource({
                property: `test${Math.floor(Math.random() * 10000)}`
            })
        );
    });

    it("supports saving and loading", function () {
        return this.mds
            .save(this.vault.format.history, Credentials.fromPassword("test"))
            .then(() => this.mds.load(Credentials.fromPassword("test")))
            .then(({ Format, history }) => Vault.createFromHistory(history, Format))
            .then((vault) => {
                const entry = vault.findEntriesByProperty("title", "Test")[0];
                expect(entry.getProperty("username")).to.equal("test");
            });
    });

    it("supports writing and reading attachments", function () {
        const attachmentText = "This is a sample string,\nwith irrelevant contents.";
        const buff = stringToArrayBuffer(attachmentText);
        const vaultID = this.vault.id;
        const attachmentID = uuid();
        return this.mds
            .putAttachment(vaultID, attachmentID, buff, Credentials.fromPassword("test"))
            .then(() =>
                this.mds.getAttachment(vaultID, attachmentID, Credentials.fromPassword("test"))
            )
            .then((buff2) => {
                expect(arrayBuffersAreEqual(buff, buff2)).to.be.true;
            });
    });
});
