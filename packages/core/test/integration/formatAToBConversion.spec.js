import { expect } from "chai";
import {
    Credentials,
    TextDatasource,
    Vault,
    VaultFormatA,
    VaultFormatID,
    VaultManager,
    VaultSource,
    setDefaultFormat
} from "../../dist/node/index.js";

async function createTextSourceCredentials() {
    const vault = new Vault();
    const general = vault.createGroup("General");
    const loginEntry = general
        .createEntry("Login")
        .setProperty("username", "user")
        .setProperty("password", "test");
    loginEntry.setProperty("password", "passw0rd");
    const tds = new TextDatasource(Credentials.fromDatasource({ type: "text" }, "test"));
    const encrypted = await tds.save(vault.format.getHistory(), Credentials.fromPassword("test"));
    return Credentials.fromDatasource(
        {
            type: "text",
            content: encrypted
        },
        "test"
    );
}

describe("vault conversion: A to B", function () {
    beforeEach(async function () {
        setDefaultFormat(VaultFormatA);
        this.sourceCredentials = await createTextSourceCredentials();
        this.vaultSource = new VaultSource(
            "Test",
            "text",
            await this.sourceCredentials.toSecureString()
        );
        this.vaultManager = new VaultManager();
        await this.vaultManager.addSource(this.vaultSource);
        // Unlock
        await this.vaultSource.unlock(Credentials.fromPassword("test"));
        // Convert
        await this.vaultSource.convert(VaultFormatID.B);
    });

    it("retains groups", function () {
        const [generalGroup] = this.vaultSource.vault.findGroupsByTitle("General");
        expect(generalGroup.getTitle()).to.equal("General");
    });

    it("retains entries", function () {
        const [loginEntry] = this.vaultSource.vault.findEntriesByProperty("title", "Login");
        expect(loginEntry.getProperty("username")).to.equal("user");
    });

    it("retains entry property history", function () {
        const [loginEntry] = this.vaultSource.vault.findEntriesByProperty("title", "Login");
        const changes = loginEntry.getChanges().filter((change) => change.property === "password");
        expect(changes).to.have.lengthOf(2);
        expect(changes.map((change) => change.value)).to.deep.equal(["test", "passw0rd"]);
    });
});
