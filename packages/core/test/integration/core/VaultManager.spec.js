import { join } from "path";
import { expect } from "chai";
import sinon from "sinon";
import { dir } from "tmp";
import {
    Credentials,
    FileDatasource,
    Group,
    TextDatasource,
    Vault,
    VaultFormatA,
    VaultFormatB,
    VaultManager,
    VaultSource,
    VaultSourceStatus,
    setDefaultFormat
} from "../../../dist/node/index.js";

async function createTextSourceCredentials() {
    const vault = new Vault();
    const general = vault.createGroup("General");
    general.createEntry("Login").setProperty("username", "user").setProperty("password", "test");
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

describe("VaultManager", function () {
    [
        ["Format A", VaultFormatA],
        ["Format B", VaultFormatB]
    ].forEach(([name, Format]) => {
        describe(`using ${name}`, function () {
            beforeEach(function (done) {
                setDefaultFormat(Format);
                this.vaultManager = new VaultManager({
                    autoUpdate: false
                });
                dir((err, dirPath, cleanup) => {
                    if (err) return document(err);
                    this.tmpDir = dirPath;
                    this.cleanup = cleanup;
                    done();
                });
            });

            afterEach(function () {
                this.cleanup();
                setDefaultFormat();
            });

            it("can migrate & unlock legacy vaults", async function () {
                await this.vaultManager._sourceStorage.setValue(
                    `${VaultManager.STORAGE_KEY_PREFIX}b441aecb-810c-4665-a164-9d2e9a2b932a`,
                    JSON.stringify({
                        id: "b441aecb-810c-4665-a164-9d2e9a2b932a",
                        name: "testing",
                        type: "text",
                        status: "locked",
                        colour: "#000000",
                        order: 0,
                        meta: {},
                        sourceCredentials:
                            "b~>buttercup/acreds.v2.BI288tF4BPFCWbuiLooO/8gYLtCtIkgYLKyGX5I+MVmnu1tkg6QMpNdXv8Nz+MXdNHkIVc6FP+Uu+C6nUh0LhPRZAr6Lxi2SHJ4Iq4a+2S2/u9faDMQjxLErPlEhBgQ/DS+1WUGroKPiJeQy6otKKEmwyeut3WtBsm+JUbYz7hl/vX+UlU+DpKwl/TNLWPW9lGiIvCdMWD9yvbSyqPZU9LKasPVNjTI3/tmKQeMwxGSEa+TJZToV6KjTnwKAJ/mWTHa4SqdJhrjb9R1X+wZcssNNBfGa/dh/yNTs59hhSBlnSv1BMEFSFxvaR+bTJHl/WqSxinkrSE1dZlCOJVqPNlOnKz+3GU6q5cQk37azLXUcoM8BPwTsijfom3KwkCQCg7695RMAb56LKq1he29OeUF8d0dXmkT6A/LLDd+Uvr0UPekd4Gh6op9GQRRWNQSo0/agRwKD1OCpar2N6di31VjPPUNpnAH+V1EpiE6F2+zBXzyrtmqzuIS3SUUKCKgsY9fkpXjP0Tx5qyfliP6h2Y1wboVfjwfKJwKqY0ZaBJTjn5xNv6y9Gq21g0uwOWkled6GjKdX2Fm8rqAECY9gK3WzuFYKUBkBSOkLN+x3OM+dG166OAld/gJcN7y02G1ATONu9Zuvc8kKFN+2ZesurgpxmcObdQKm2ZiL4Q2fGA1rax8hHRNOcGT0R6qs8IEX3bHBwzpHKa+ClyLju9XCwY4KOPzzHP4cgQlgrF2Ye+9N+2KdMziG07hTp7l6KeHKF/JzVrvi/nGx9zAeufOgSF57ZlMb5w93/2cZlU2Xgs/33gL5yVKIGACiQ7AYRNtMLZ3Wn4rW1B4+8XVujpuYsEpUd2oHy7as+abFWjCTFJNtvZk8BIMJD8ItIkcUHJZX2y02jmMhIivxwXS4KOPwogSNYiAu5wrKgf4VqZnF0Ak3k+vKWGPj8sWNlmZjk8yZwnqi7R0b8rumWFbkLYFSY4iXCZx4QmvPB8DaFfzW4gaNiCU6MSTPfDUEnmqdI7rIrru3toNcE1wYtMMV/9mh836VJUuq78okO5ks+TF94T0i19pVq6FKLcfN919eqd+/dVs/6eP5kBpAc6JgHHUNwLBsLoQlBQSrrIAJoRkgwmJ/VUOH1MK/bhv7JV81WZO8$e9e75e4b106980af555b0a251e944d1b$hf9KttMqrwaM$10d9b0b9637c9e44226b746280f66713e68930af39a31c9ffdabb5f79ed579e3$10$cbc",
                        archiveCredentials:
                            "b~>buttercup/acreds.v2.d7APLorDcHoE4tAfrfFw9mH09XunmGIpGHC258eKR8t1KyQ9Z0kJI2GH3w/QS8Dx$7f3a51cbaa4dfbc9137140c7fe1cb3a3$Thyj3N1x9j2I$57013005f4ebdac3350a72528a02a972cb95589d0150220a57e862af9cac9079$10$cbc"
                    })
                );
                await this.vaultManager.rehydrate();
                await this.vaultManager.sources[0].unlock(Credentials.fromPassword("test"));
                expect(this.vaultManager.sources[0].status).to.equal(VaultSource.STATUS_UNLOCKED);
            });

            it("can merge differences between local and remote vaults", async function () {
                const vaultPath = join(this.tmpDir, "vault.bcup");
                // Init first
                const creds = Credentials.fromDatasource(
                    {
                        type: "file",
                        path: vaultPath
                    },
                    "test"
                );
                const credsStr = await creds.toSecureString();
                const source = new VaultSource("Test", "file", credsStr);
                await this.vaultManager.addSource(source);
                await source.unlock(Credentials.fromPassword("test"), { initialiseRemote: true });
                // Make changes to remote
                const fds = new FileDatasource(creds);
                const loadedTemp = await fds.load(Credentials.fromPassword("test"));
                const tempVault = Vault.createFromHistory(loadedTemp.history, loadedTemp.Format);
                tempVault.createGroup("Remote");
                await fds.save(tempVault.format.history, Credentials.fromPassword("test"));
                // Make changes to local
                source.vault.createGroup("Local");
                // Save (+ merge)
                await source.save();
                // Expect the changes are present
                const remoteGroup = source.vault.findGroupsByTitle("Remote")[0];
                const localGroup = source.vault.findGroupsByTitle("Local")[0];
                expect(remoteGroup).to.be.an.instanceOf(Group, "Remote item should be a group");
                expect(localGroup).to.be.an.instanceOf(Group, "Local item should be a group");
            });
        });
    });

    describe("with VaultSource", function () {
        beforeEach(async function () {
            this.vaultManager = new VaultManager({
                autoUpdate: false
            });
            const sourceCredentials = await createTextSourceCredentials();
            this.vaultSource = new VaultSource(
                "Test",
                "text",
                await sourceCredentials.toSecureString()
            );
            await this.vaultManager.addSource(this.vaultSource);
        });

        it("supports renaming sources", function (done) {
            sinon.spy(this.vaultManager, "dehydrateSource");
            const updatedSpy = sinon.spy();
            this.vaultSource.on("updated", updatedSpy);
            this.vaultSource.rename("new-name");
            setTimeout(() => {
                expect(updatedSpy.calledOnce).to.be.true;
                expect(this.vaultManager.dehydrateSource.calledWithExactly(this.vaultSource)).to.be
                    .true;
                done();
            }, 100);
        });

        it("stores offline copies (unlock)", async function () {
            expect(await this.vaultSource.checkOfflineCopy()).to.equal(
                false,
                "Should not have offline copy"
            );
            await this.vaultSource.unlock(Credentials.fromPassword("test"));
            expect(await this.vaultSource.checkOfflineCopy()).to.equal(
                true,
                "Should have offline copy"
            );
        });

        it("stores offline copies (save)", async function () {
            await this.vaultSource.unlock(Credentials.fromPassword("test"), {
                storeOfflineCopy: false
            });
            expect(await this.vaultSource.checkOfflineCopy()).to.equal(
                false,
                "Should not have offline copy"
            );
            await this.vaultSource.save();
            expect(await this.vaultSource.checkOfflineCopy()).to.equal(
                true,
                "Should have offline copy"
            );
        });

        it("loads from offline copies", async function () {
            await this.vaultSource.unlock(Credentials.fromPassword("test"));
            await this.vaultSource.lock();
            await this.vaultSource.unlock(Credentials.fromPassword("test"), {
                loadOfflineCopy: true
            });
            expect(this.vaultSource.status).to.equal(VaultSourceStatus.Unlocked);
            expect(this.vaultSource.vault.format).to.have.property(
                "readOnly",
                true,
                "Vault should be read-only"
            );
        });
    });
});
