import { join } from "path";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { dir } from "tmp";
import { Credentials, FileDatasource, Vault } from "../../../dist/node/index.js";

describe("FileDatasource", function () {
    beforeEach(function (done) {
        this.vault = Vault.createWithDefaults();
        this.vault
            .findGroupsByTitle("General")[0]
            .createEntry("Test")
            .setProperty("username", "test");
        dir((err, dirPath, cleanup) => {
            if (err) return done(err);
            this.fds = new FileDatasource(
                Credentials.fromDatasource({
                    path: join(dirPath, "vault.bcup")
                })
            );
            this.cleanup = cleanup;
            done();
        });
    });

    afterEach(function () {
        this.cleanup();
    });

    it("supports saving and loading", function () {
        return this.fds
            .save(this.vault.format.history, Credentials.fromPassword("test"))
            .then(() => this.fds.load(Credentials.fromPassword("test")))
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
        return this.fds
            .putAttachment(vaultID, attachmentID, buff, Credentials.fromPassword("test"))
            .then(() =>
                this.fds.getAttachment(vaultID, attachmentID, Credentials.fromPassword("test"))
            )
            .then((buff2) => {
                expect(buff2.equals(buff)).to.be.true;
            });
    });
});
