import { resolve as resolveDirectory } from "node:path";
import { readFile } from "node:fs/promises";
import { z } from "zod";

const PackageJSONSchema = z.object({
    name: z.string(),
    scripts: z.record(z.string()).optional().default({}),
    dependencies: z.record(z.string()).optional().default({}),
    devDependencies: z.record(z.string()).optional().default({})
});

export type PackageJSON = z.infer<typeof PackageJSONSchema>;

export interface TargetDependency {
    name: string;
    packagePath: string;
}

async function fetchPackageJSONData(projectPath: string): Promise<PackageJSON> {
    const packageJSONPath = resolveDirectory(projectPath, "package.json");
    const contents = await readFile(packageJSONPath, "utf-8");

    return PackageJSONSchema.parse(JSON.parse(contents));
}

export async function fetchTargetDependencies(projectPath: string, rootPath: string): Promise<Array<TargetDependency>> {
    const packageJSON = await fetchPackageJSONData(projectPath);
    const dependencies = {
        ...packageJSON.dependencies,
        ...packageJSON.devDependencies
    };

    const workspacePackages = Object.keys(dependencies).filter(name => dependencies[name] === "*");

    const packagesPath = resolveDirectory(rootPath, "./packages");

    const initialPackages = workspacePackages.map(packageName => ({
        name: packageName,
        packagePath: resolveDirectory(packagesPath, packageName.split("/")[1])
    }));
    const output: Array<TargetDependency> = [];

    for (const pkg of initialPackages) {
        const subPackageJSON = await fetchPackageJSONData(pkg.packagePath);
        if (typeof subPackageJSON.scripts["dev"] === "string") {
            output.push(pkg);
        }
    }

    return output;
}
