import { expect } from "chai";
import {
    Entry,
    EntryPropertyValueType,
    EntryType,
    Vault,
    createFieldDescriptor
} from "../../../dist/node/index.js";

describe("facades/tools", function () {
    beforeEach(function () {
        const vault = new Vault();
        this.entry = vault.createGroup("test").createEntry("Email");
        this.entry.setProperty("username", "user@email.com");
        this.entry.setAttribute("testAttribute", "testValue");
    });

    describe("createFieldDescriptor", function () {
        it("supports outputting empty structures", function () {
            const obj = createFieldDescriptor(null, "Test", "property", "test");
            expect(obj).to.be.an("object");
            expect(obj).to.have.property("title", "Test");
            expect(obj).to.have.property("propertyType", "property");
            expect(obj).to.have.property("property", "test");
            expect(obj).to.have.property("value", "");
            expect(obj).to.have.property("valueType", EntryPropertyValueType.Text);
        });

        it("supports taking the value from an Entry", function () {
            const obj = createFieldDescriptor(this.entry, "Username", "property", "username");
            expect(obj).to.have.property("title", "Username");
            expect(obj).to.have.property("propertyType", "property");
            expect(obj).to.have.property("property", "username");
            expect(obj).to.have.property("value", "user@email.com");
        });

        it("outputs valueType when set", function () {
            this.entry.setAttribute(`${Entry.Attributes.FieldTypePrefix}username`, EntryType.Note);
            const obj = createFieldDescriptor(this.entry, "Username", "property", "username");
            expect(obj).to.have.property("valueType", EntryType.Note);
        });
    });
});
