import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { Credentials, MemoryDatasource, Vault } from "../../../dist/node/index.js";

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
        const buff = Buffer.from(attachmentText);
        const vaultID = this.vault.id;
        const attachmentID = uuid();
        return this.mds
            .putAttachment(vaultID, attachmentID, buff, Credentials.fromPassword("test"))
            .then(() =>
                this.mds.getAttachment(vaultID, attachmentID, Credentials.fromPassword("test"))
            )
            .then((buff2) => {
                expect(buff2.equals(buff)).to.be.true;
            });
    });
});
