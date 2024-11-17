import { Group, Vault } from "../../source/index.web.js";

describe("Vault", function () {
    it("can be instantiated", function () {
        const v1 = new Vault();
        expect(v1).to.be.an.instanceof(Vault);
    });

    it("can create groups", function () {
        const v1 = new Vault();
        const g1 = v1.createGroup("Custom");
        expect(g1).to.be.an.instanceof(Group);
    });
});
