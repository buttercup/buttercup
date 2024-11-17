import { v4 as uuid } from "uuid";
import { Credentials, LocalStorageDatasource, Vault } from "../../source/index.web.js";

describe("LocalStorageDatasource", function () {
    beforeEach(function () {
        this.vault = Vault.createWithDefaults();
        this.vault
            .findGroupsByTitle("General")[0]
            .createEntry("Test")
            .setProperty("username", "test");
        this.mds = new LocalStorageDatasource(
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
});
