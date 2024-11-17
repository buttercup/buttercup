import { expect } from "chai";
import { get } from "nested-property";
import {
    convertFormatAEntry,
    convertFormatAGroup
} from "../../../../dist/node/io/formatB/conversion.js";

describe("io/formatB/conversion", function () {
    function testEntry(actualPath, expectedPath) {
        it("sets correct entry ID", function () {
            const actual = get(this, actualPath);
            const expected = get(this, expectedPath);
            expect(actual).to.have.property("id", expected.id);
        });

        it("sets correct entry parent ID", function () {
            const actual = get(this, actualPath);
            const expected = get(this, expectedPath);
            expect(actual).to.have.property("g", expected.parentID);
        });

        it("sets correct entry attributes", function () {
            const actual = get(this, actualPath);
            expect(actual).to.have.property("a").that.is.an("object");
            expect(actual).to.have.nested.property("a.test-attr").that.is.an("object");
            expect(actual).to.have.nested.property("a.test-attr.value", "test-value");
        });

        it("sets correct entry properties", function () {
            const actual = get(this, actualPath);
            expect(actual).to.have.property("p").that.is.an("object");
            expect(actual).to.have.nested.property("p.test-prop").that.is.an("object");
            expect(actual).to.have.nested.property("p.test-prop.value", "test-value");
        });
    }

    function testGroup(actualPath, expectedPath) {
        it("sets correct group ID", function () {
            const actual = get(this, actualPath);
            const expected = get(this, expectedPath);
            expect(actual).to.have.property("id", expected.id);
        });

        it("sets correct group title", function () {
            const actual = get(this, actualPath);
            const expected = get(this, expectedPath);
            expect(actual).to.have.property("t", expected.title);
        });

        it("sets correct group attributes", function () {
            const actual = get(this, actualPath);
            expect(actual).to.have.property("a").that.is.an("object");
            expect(actual).to.have.nested.property("a.test-attr").that.is.an("object");
            expect(actual).to.have.nested.property("a.test-attr.value", "test-value");
        });

        it("sets correct group parent ID", function () {
            const actual = get(this, actualPath);
            const expected = get(this, expectedPath);
            expect(actual).to.have.property("g", expected.parentID);
        });
    }

    describe("convertFormatAEntry", function () {
        beforeEach(function () {
            this.formatAEntry = {
                id: "abc123",
                attributes: {
                    "test-attr": "test-value"
                },
                properties: {
                    "test-prop": "test-value"
                },
                parentID: "parent123"
            };
            this.formatBEntry = convertFormatAEntry(this.formatAEntry);
        });

        testEntry("formatBEntry", "formatAEntry");
    });

    describe("convertFormatAGroup", function () {
        beforeEach(function () {
            this.formatAGroup = {
                id: "abc123",
                attributes: {
                    "test-attr": "test-value"
                },
                title: "My group",
                parentID: "0",
                groups: [
                    {
                        id: "def456",
                        attributes: {
                            subgroup: "subvalue"
                        },
                        title: "My sub group",
                        parentID: "abc123"
                    }
                ],
                entries: [
                    {
                        id: "xyz999",
                        attributes: {
                            "test-attr": "test-value"
                        },
                        properties: {
                            "test-prop": "test-value"
                        },
                        parentID: "abc123"
                    }
                ]
            };
            this.formatBGroup = convertFormatAGroup(this.formatAGroup);
        });

        testGroup("formatBGroup", "formatAGroup");
    });
});
