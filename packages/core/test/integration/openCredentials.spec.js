import { expect } from "chai";
import {
    Credentials,
    MemoryDatasource,
    VaultManager,
    VaultSource,
    registerDatasource
} from "../../dist/node/index.js";

class FakeDatasource extends MemoryDatasource {
    constructor(creds) {
        super(creds);
        this.initData = creds.getData();
        try {
            this.type = this.initData.data.datasource.type;
        } catch (err) {}
    }

    load(creds) {
        this.loadData = creds.getData();
        return super.load(creds);
    }
}

describe("VaultSource with custom datasource", function () {
    beforeEach(async function () {
        this.datasourceTypeDefault = `fake-datasource-default-${Math.floor(
            Math.random() * 999999
        )}`;
        this.datasourceTypeOpen = `fake-datasource-open-${Math.floor(Math.random() * 999999)}`;
        registerDatasource(this.datasourceTypeDefault, FakeDatasource);
        registerDatasource(this.datasourceTypeOpen, FakeDatasource, {
            open: true
        });
        this.vaultManager = new VaultManager();
        const credsOpen = Credentials.fromDatasource(
            {
                type: this.datasourceTypeOpen,
                property: `test-${Math.floor(Math.random() * 999999)}`
            },
            "test"
        );
        const credsDefault = Credentials.fromDatasource(
            {
                type: this.datasourceTypeDefault,
                property: `test-${Math.floor(Math.random() * 999999)}`
            },
            "test"
        );
        const credsOpenStr = await credsOpen.toSecureString();
        const credsDefaultStr = await credsDefault.toSecureString();
        this.vaultSourceOpen = new VaultSource("test", this.datasourceTypeOpen, credsOpenStr);
        this.vaultSourceDefault = new VaultSource(
            "test",
            this.datasourceTypeDefault,
            credsDefaultStr
        );
        await this.vaultManager.addSource(this.vaultSourceOpen);
        await this.vaultManager.addSource(this.vaultSourceDefault);
        await this.vaultSourceOpen.unlock(Credentials.fromPassword("test"), {
            initialiseRemote: true
        });
        await this.vaultSourceDefault.unlock(Credentials.fromPassword("test"), {
            initialiseRemote: true
        });
    });

    it("provides open credentials on unlock", function () {
        const { _datasource: datasource } = this.vaultSourceOpen;
        expect(datasource.initData).to.have.nested.property(
            "data.datasource.type",
            this.datasourceTypeOpen
        );
        expect(datasource.initData).to.have.property("open", true);
    });

    it("provides open credentials on load", async function () {
        await this.vaultSourceOpen.localDiffersFromRemote();
        const { _datasource: datasource } = this.vaultSourceOpen;
        expect(datasource.loadData).to.have.nested.property(
            "data.datasource.type",
            this.datasourceTypeOpen
        );
        expect(datasource.loadData).to.have.property("open", true);
    });

    it("provides closed credentials by default", function () {
        const { _datasource: datasource } = this.vaultSourceDefault;
        expect(datasource.initData).to.be.null;
    });
});
