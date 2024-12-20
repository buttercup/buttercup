import { concurrently } from "concurrently";
import { TargetDependency } from "./package.js";

export async function buildPackagesConcurrently(
    dependencies: Array<TargetDependency>,
    {
        extraCommands = []
    }: {
        extraCommands?: Array<string>;
    }
): Promise<void> {
    const { result } = concurrently(
        [
            ...dependencies.map(dep => ({
                name: dep.name,
                command: `npm run dev`,
                cwd: dep.packagePath
            })),
            ...extraCommands.map((command, ind) => ({
                name: `cmd-${ind}`,
                command,
                cwd: process.cwd()
            }))
        ],
        {
            raw: true
        }
    );
    await result;
}
