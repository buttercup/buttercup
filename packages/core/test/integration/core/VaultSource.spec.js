import { expect } from "chai";
import {
    Credentials,
    MemoryDatasource,
    Vault,
    VaultFormatA,
    VaultFormatB,
    VaultFormatID,
    VaultManager,
    VaultSource,
    setDefaultFormat,
    VaultSourceStatus
} from "../../../dist/node/index.js";

async function createTextSourceCredentials() {
    const memoryProperty = `test${Math.random()}`;
    const vault = new Vault();
    const general = vault.createGroup("General");
    general.createEntry("Login").setProperty("username", "user").setProperty("password", "test");
    const mds = new MemoryDatasource(
        Credentials.fromDatasource({ type: "memory", property: memoryProperty }, "test")
    );
    const encrypted = await mds.save(vault.format.getHistory(), Credentials.fromPassword("test"));
    return Credentials.fromDatasource(
        {
            type: "memory",
            content: encrypted,
            property: memoryProperty
        },
        "test"
    );
}

describe("VaultSource", function () {
    [
        ["Format A", VaultFormatA],
        ["Format B", VaultFormatB]
    ].forEach(([name, Format]) => {
        describe(`using ${name}`, function () {
            beforeEach(async function () {
                setDefaultFormat(Format);
                this.sourceCredentials = await createTextSourceCredentials();
                this.vaultSource = new VaultSource(
                    "Test",
                    "text",
                    await this.sourceCredentials.toSecureString()
                );
                this.vaultManager = new VaultManager();
                await this.vaultManager.addSource(this.vaultSource);
            });

            afterEach(function () {
                setDefaultFormat();
            });

            describe("while locked", function () {
                describe("testMasterPassword", function () {
                    it("returns true for matching password", async function () {
                        const res = await this.vaultSource.testMasterPassword("test");
                        expect(res).to.be.true;
                    });

                    it("returns false for non-matching password", async function () {
                        const res = await this.vaultSource.testMasterPassword("abc");
                        expect(res).to.be.false;
                    });
                });
            });

            describe("while unlocked", function () {
                beforeEach(async function () {
                    await this.vaultSource.unlock(Credentials.fromPassword("test"));
                });

                it("sets source ID on datasource", function () {
                    expect(this.vaultSource._datasource.sourceID).to.equal(this.vaultSource.id);
                });

                if (Format === VaultFormatA) {
                    describe("convert", function () {
                        it("converts from format A to B", async function () {
                            await this.vaultSource.convert(VaultFormatID.B);
                            const [loginEntry] = this.vaultSource.vault.findEntriesByProperty(
                                "title",
                                "Login"
                            );
                            expect(loginEntry.getProperty("username")).to.equal("user");
                        });
                    });
                }

                describe("using live snapshots", function () {
                    it("can collect relevant data", function () {
                        const snapshot = this.vaultSource.getLiveSnapshot();
                        expect(snapshot)
                            .to.have.nested.property("credentials.data")
                            .that.is.an("object");
                        expect(snapshot).to.have.property("formatID", Format.getFormatID());
                        expect(snapshot).to.have.property("version", "1a");
                    });

                    it("can restore vault source unlocked state", async function () {
                        const snapshot = this.vaultSource.getLiveSnapshot();
                        await this.vaultSource.lock();
                        expect(this.vaultSource.status).to.equal(VaultSourceStatus.Locked);
                        expect(this.vaultSource.attachmentManager).to.be.null;
                        await this.vaultSource.restoreFromLiveSnapshot(snapshot);
                        expect(this.vaultSource.status).to.equal(VaultSourceStatus.Unlocked);
                        expect(this.vaultSource.attachmentManager).to.not.be.null;
                        const passwordWorks = await this.vaultSource.testMasterPassword("test");
                        expect(passwordWorks).to.equal(true, "Password should match");
                    });
                });

                describe("save", function () {
                    it("saves changes", async function () {
                        let [loginEntry] = this.vaultSource.vault.findEntriesByProperty(
                            "title",
                            "Login"
                        );
                        loginEntry.setProperty("username", "user2");
                        await this.vaultSource.save();
                        await this.vaultSource.lock();
                        await this.vaultSource.unlock(Credentials.fromPassword("test"));
                        [loginEntry] = this.vaultSource.vault.findEntriesByProperty(
                            "title",
                            "Login"
                        );
                        expect(loginEntry.getProperty("username")).to.equal("user2");
                    });

                    it("saves new properties", async function () {
                        let [loginEntry] = this.vaultSource.vault.findEntriesByProperty(
                            "title",
                            "Login"
                        );
                        loginEntry.setProperty("extra", "123");
                        await this.vaultSource.save();
                        await this.vaultSource.lock();
                        await this.vaultSource.unlock(Credentials.fromPassword("test"));
                        [loginEntry] = this.vaultSource.vault.findEntriesByProperty(
                            "title",
                            "Login"
                        );
                        expect(loginEntry.getProperty("extra")).to.equal("123");
                    });
                });

                describe("testMasterPassword", function () {
                    it("returns true for matching password", async function () {
                        const res = await this.vaultSource.testMasterPassword("test");
                        expect(res).to.be.true;
                    });

                    it("returns false for non-matching password", async function () {
                        const res = await this.vaultSource.testMasterPassword("abc");
                        expect(res).to.be.false;
                    });
                });
            });
        });
    });
});
