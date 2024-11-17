import { expect } from "chai";
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Credentials, FileDatasource, Vault } from "../../dist/node/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("reading old vaults", function () {
    describe("Format A", function () {
        const VAULTS_DIR = resolve(__dirname, "../resources/vaults/format-a");
        const PASSWORD = "this is a long password used for a test archive!";

        readdirSync(VAULTS_DIR).forEach((filename) => {
            const [, version] = /test-archive-(\d+\.\d+\.\d+(\-[0-9a-zA-Z.]+)?)\.bcup/.exec(
                filename
            );
            describe(`v${version}`, function () {
                const readVault = () => {
                    const creds = Credentials.fromDatasource(
                        {
                            path: join(VAULTS_DIR, filename)
                        },
                        PASSWORD
                    );
                    const fds = new FileDatasource(creds);
                    return fds
                        .load(Credentials.fromPassword(PASSWORD))
                        .then(({ Format, history }) => Vault.createFromHistory(history, Format));
                };

                it("can be opened", function () {
                    return readVault().then((archive) => {
                        expect(archive).to.be.an.instanceof(Vault);
                    });
                });
            });
        });
    });

    describe("Format B", function () {
        const VAULTS_DIR = resolve(__dirname, "../resources/vaults/format-b");
        const PASSWORD = "this is a long password used for a test vault!";

        readdirSync(VAULTS_DIR).forEach((filename) => {
            const [, version] = /test-vault-(\d+\.\d+\.\d+(\-[0-9a-zA-Z.]+)?)\.bcup/.exec(filename);
            describe(`v${version}`, function () {
                const readVault = async () => {
                    const creds = Credentials.fromDatasource(
                        {
                            path: join(VAULTS_DIR, filename)
                        },
                        PASSWORD
                    );
                    const fds = new FileDatasource(creds);
                    const { Format, history } = await fds.load(Credentials.fromPassword(PASSWORD));
                    return Vault.createFromHistory(history, Format);
                };

                it("can be opened", async function () {
                    const vault = await readVault();
                    expect(vault).to.be.an.instanceof(Vault);
                });

                it("can read entry properties", async function () {
                    const vault = await readVault();
                    const entry = vault.findEntriesByProperty("title", "test-entry-main")[0];
                    expect(entry.getProperty("username")).to.equal("user123한@test.рф");
                    expect(entry.getProperty("password")).to.equal("* পাসওয়ার্ড! ");
                    expect(entry.getProperty("test-meta")).to.equal("test-value 8");
                });

                it("can read entry attributes", async function () {
                    const vault = await readVault();
                    const entry = vault.findEntriesByProperty("title", "test-entry-main")[0];
                    expect(entry.getAttribute("ატრიბუტი")).to.equal("ความคุ้มค่า");
                });

                it("can read group attributes", async function () {
                    const vault = await readVault();
                    const group = vault.findGroupsByTitle("test-group-main")[0];
                    expect(group.getAttribute("ატრიბუტი")).to.equal("ความคุ้มค่า");
                });
            });
        });
    });
});
