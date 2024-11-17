import { expect } from "chai";
import { Credentials } from "../../../dist/node/index.js";

describe("credentials/Credentials", function () {
    beforeEach(function () {
        setClosedEnv(true);
        this.credentials = new Credentials(
            {
                datasource: {
                    type: "text"
                }
            },
            "test"
        );
    });

    afterEach(function () {
        setClosedEnv(false);
    });

    describe("getCredentialsData", function () {
        it("returns stored data", function () {
            const data = this.credentials.getCredentialsData();
            expect(data).to.deep.equal({
                datasource: {
                    type: "text"
                }
            });
        });
    });

    describe("setCredentialsData", function () {
        it("updates stored data", function () {
            this.credentials.setCredentialsData({
                datasource: {
                    type: "file"
                }
            });
            const data = this.credentials.getCredentialsData();
            expect(data).to.deep.equal({
                datasource: {
                    type: "file"
                }
            });
        });
    });
});
