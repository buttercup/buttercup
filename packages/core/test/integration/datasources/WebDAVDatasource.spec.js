import { expect } from "chai";
import { dirSync } from "tmp";
import { Credentials, Vault, WebDAVDatasource } from "../../../dist/node/index.js";
import { PASSWORD, PATH, PORT, USERNAME, createServer } from "../../resources/webdavServer.js";

describe("WebDAVDatasource", function () {
    beforeEach(async function () {
        // Server
        this.dir = dirSync().name;
        this.server = createServer(this.dir, "basic");
        await this.server.start();
        // Vault
        this.vault = Vault.createWithDefaults();
        this.vault
            .findGroupsByTitle("General")[0]
            .createEntry("Test")
            .setProperty("username", "test");
        const webdavURL = `http://localhost:${PORT}${PATH}`;
        this.datasource = new WebDAVDatasource(
            Credentials.fromDatasource(
                {
                    endpoint: webdavURL,
                    password: PASSWORD,
                    path: "/test.bcup",
                    username: USERNAME
                },
                "test"
            )
        );
    });

    afterEach(async function () {
        await this.server.stop();
    });

    it("supports saving and loading", async function () {
        await this.datasource.save(this.vault.format.history, Credentials.fromPassword("test"));
        const { Format, history } = await this.datasource.load(Credentials.fromPassword("test"));
        const vault = Vault.createFromHistory(history, Format);
        const entry = vault.findEntriesByProperty("title", "Test")[0];
        expect(entry.getProperty("username")).to.equal("test");
    });
});
