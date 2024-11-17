import { expect } from "chai";
import { fileSync } from "tmp";
import { Credentials, VaultManager, VaultSource } from "../../dist/node/index.js";

describe("VaultManager", function () {
    describe("with file datasource", function () {
        beforeEach(async function () {
            this.vaultManager = new VaultManager({
                autoUpdate: false
            });
            // source 1
            this.tmp1 = fileSync();
            const creds = Credentials.fromDatasource(
                {
                    type: "file",
                    path: this.tmp1.name
                },
                "test"
            );
            const credStr = await creds.toSecureString();
            this.vaultSource1 = new VaultSource("test", "file", credStr);
            await this.vaultManager.addSource(this.vaultSource1);
            await this.vaultSource1.unlock(Credentials.fromPassword("test"), {
                initialiseRemote: true
            });
            // source 2
            this.tmp2 = fileSync();
            const creds2 = Credentials.fromDatasource(
                {
                    type: "file",
                    path: this.tmp2.name
                },
                "test"
            );
            const credStr2 = await creds2.toSecureString();
            this.vaultSource2 = new VaultSource("test2", "file", credStr2);
            await this.vaultManager.addSource(this.vaultSource2);
            await this.vaultSource2.unlock(Credentials.fromPassword("test"), {
                initialiseRemote: true
            });
        });

        afterEach(function () {
            this.tmp1.removeCallback();
            this.tmp2.removeCallback();
        });

        it("can change password", async function () {
            await this.vaultSource1.changeMasterPassword("test", "test2");
            expect(this.vaultSource1.status).to.equal(VaultSource.STATUS_UNLOCKED);
            await this.vaultSource1.lock();
            await this.vaultSource1.unlock(Credentials.fromPassword("test2"));
            expect(this.vaultSource1.status).to.equal(VaultSource.STATUS_UNLOCKED);
        });

        describe("sources", function () {
            it("stores sources initially in the order they were added", function () {
                const [source1, source2] = this.vaultManager.sources;
                expect(source1.id).to.equal(this.vaultSource1.id);
                expect(source2.id).to.equal(this.vaultSource2.id);
            });
        });

        describe("reorderSource", function () {
            it("changes the order of sources", async function () {
                await this.vaultManager.reorderSource(this.vaultSource2.id, 0);
                const [source1, source2] = this.vaultManager.sources;
                expect(source1.id).to.equal(this.vaultSource2.id);
                expect(source2.id).to.equal(this.vaultSource1.id);
            });
        });
    });
});
