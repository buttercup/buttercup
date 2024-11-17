import {
    Credentials,
    Entry,
    EntryType,
    Group,
    Vault,
    VaultManager,
    VaultSource
} from "../../../dist/node/index.js";

export async function createSampleManager() {
    const manager = new VaultManager({
        autoUpdate: false
    });
    const creds = Credentials.fromDatasource(
        {
            type: "memory",
            property: `test:${Math.floor(Math.random() * 1000000)}`
        },
        "test"
    );
    const credsStr = await creds.toSecureString();
    const source = new VaultSource("Refs test", "memory", credsStr);
    await manager.addSource(source);
    await source.unlock(Credentials.fromPassword("test"), {
        initialiseRemote: true
    });
    createSampleVault(source.vault);
    await source.save();
    return [manager, source];
}

export function createSampleVault(vault = new Vault()) {
    const groupA = vault.createGroup("Email");
    groupA
        .createEntry("Personal Mail")
        .setProperty("username", "green.monkey@fastmail.com")
        .setProperty("password", "df98Sm2.109x{91")
        .setProperty("url", "https://fastmail.com")
        .setAttribute(Entry.Attributes.FacadeType, EntryType.Website);
    groupA
        .createEntry("Work")
        .setProperty("username", "j.crowley@gmov.edu.au")
        .setProperty("password", "#f05c.*skU3")
        .setProperty("URL", "gmov.edu.au/portal/auth")
        .addTags("job");
    groupA
        .createEntry("Work logs")
        .setProperty("username", "j.crowley@gmov.edu.au")
        .setProperty("password", "#f05c.*skU3")
        .setProperty("URL", "https://logs.gmov.edu.au/sys30/atc.php")
        .addTags("job");
    const groupB = vault.createGroup("Bank");
    groupB
        .createEntry("MyBank")
        .setProperty("username", "324654356346")
        .setProperty("PIN", "1234")
        .setAttribute(Entry.Attributes.FacadeType, EntryType.Login)
        .addTags("finance", "banking");
    groupB
        .createEntry("Insurance")
        .setProperty("username", "testing-user")
        .setProperty("URL", "http://test.org/portal-int/login.aspx")
        .addTags("finance");
    const groupC = vault.createGroup("General");
    groupC
        .createEntry("Clipart")
        .setProperty("username", "gmonkey123")
        .setProperty("password", "test93045")
        .setProperty("Url", "clipart.com");
    groupC
        .createEntry("Wordpress")
        .setProperty("username", "gmonkey1234")
        .setProperty("password", "passw0rd")
        .setProperty("Url", "https://wordpress.com/")
        .setProperty("Login URL", "https://wordpress.com/account/login.php");
    const trashGroup = vault.createGroup("Trash");
    trashGroup
        .createEntry("Ebay")
        .setProperty("username", "gmk123@hotmail.com")
        .setProperty("password", "passw0rd")
        .setProperty("Url", "https://ebay.com/");
    trashGroup.setAttribute(Group.Attribute.Role, "trash");
    return vault;
}
