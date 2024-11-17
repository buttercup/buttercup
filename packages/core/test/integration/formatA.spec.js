import { expect } from "chai";
import {
    Credentials,
    MemoryDatasource,
    Vault,
    VaultFormatA,
    setDefaultFormat
} from "../../dist/node/index.js";

describe("Format A", function () {
    function reduceCommandsToPadIDs(output, cmd) {
        const [method, id] = cmd.split(" ");
        if (method.toLowerCase() === "pad") {
            output.push(id);
        }
        return output;
    }

    beforeEach(function () {
        setDefaultFormat(VaultFormatA);
    });

    afterEach(function () {
        setDefaultFormat();
    });

    it("retains PAD IDs between loads", async function () {
        let vault = new Vault();
        vault.createGroup("General").createGroup("Test").createGroup("Sub");
        const memStore = `formatATest-${Math.random()}`;
        const mds = new MemoryDatasource(
            Credentials.fromDatasource(
                {
                    property: memStore
                },
                "test"
            )
        );
        const idSet1 = vault.format.getHistory().reduce(reduceCommandsToPadIDs, []);
        await mds.save(vault.format.getHistory(), Credentials.fromPassword("test"));
        const { history } = await mds.load(Credentials.fromPassword("test"));
        vault = Vault.createFromHistory(history, VaultFormatA);
        const idSet2 = vault.format.getHistory().reduce(reduceCommandsToPadIDs, []);
        expect(idSet1).to.have.length.above(0);
        expect(idSet1).to.deep.equal(idSet2);
    });

    it("retains PAD IDs between saves", async function () {
        let vault = new Vault();
        vault.createGroup("General").createGroup("Test").createGroup("Sub");
        const memStore = `formatATest-${Math.random()}`;
        const mds = new MemoryDatasource(
            Credentials.fromDatasource(
                {
                    property: memStore
                },
                "test"
            )
        );
        const idSet1 = vault.format.getHistory().reduce(reduceCommandsToPadIDs, []);
        vault.createGroup("Another");
        await mds.save(vault.format.getHistory(), Credentials.fromPassword("test"));
        const { history } = await mds.load(Credentials.fromPassword("test"));
        vault = Vault.createFromHistory(history, VaultFormatA);
        const idSet2 = vault.format.getHistory().reduce(reduceCommandsToPadIDs, []);
        const matchingSet = idSet2.slice(0, idSet1.length);
        expect(matchingSet).to.deep.equal(idSet1);
    });
});
