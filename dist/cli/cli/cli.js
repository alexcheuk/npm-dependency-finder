#!/usr/bin/env node
import { findCompatibleVersion } from "../lib/package-finder.js";
// Simple ANSI color utilities (zero dependency)
const ANSI = {
    reset: "\u001b[0m",
    bold: "\u001b[1m",
    dim: "\u001b[2m",
    red: "\u001b[31m",
    green: "\u001b[32m",
    yellow: "\u001b[33m",
    blue: "\u001b[34m",
    magenta: "\u001b[35m",
    cyan: "\u001b[36m",
    gray: "\u001b[90m",
};
function colorize(enabled) {
    if (!enabled) {
        return new Proxy(ANSI, {
            get: () => "",
        });
    }
    return ANSI;
}
function printHelp(noColor = false) {
    const C = colorize(!noColor && !process.env.NO_COLOR);
    const b = C.bold;
    const r = C.reset;
    const c = C.cyan;
    const g = C.gray;
    console.log(`${b}Usage:${r}\n  ${c}find-dep-breakpoint${r} <parent@minVersion?> <target@minVersion?> [options]\n\n${b}Description:${r}\n  Find the earliest parent package version where the target dependency (direct or transitive)\n  is removed OR meets a required minimum version threshold.\n\n${b}Examples:${r}\n  npx find-dep-breakpoint axios@1 form-data@4\n  npx find-dep-breakpoint axios@1 form-data@4 --removed\n  npx find-dep-breakpoint axios form-data@4 --removed\n\n${b}Options:${r}\n  --removed, -r     Accept removal OR min version satisfaction\n  --no-color        Disable colored output (also honored by NO_COLOR env)\n  --help, -h        Show this help\n\n${g}Exit codes: 0 success, 2 criteria not met, 1 usage error, 99 unexpected error${r}`);
}
function parseArg(spec) {
    if (!spec)
        return null;
    const at = spec.lastIndexOf("@");
    if (at <= 0)
        return { name: spec, version: "" }; // no version provided
    return { name: spec.slice(0, at), version: spec.slice(at + 1) };
}
function parseArgs(argv) {
    const positional = [];
    const flags = new Set();
    for (const token of argv) {
        if (token.startsWith("-"))
            flags.add(token);
        else
            positional.push(token);
    }
    if (positional.length < 2)
        return null;
    return {
        parent: positional[0],
        child: positional[1],
        removed: flags.has("--removed") || flags.has("-r"),
        noColor: flags.has("--no-color") || Boolean(process.env.NO_COLOR),
    };
}
async function run() {
    const [, , ...rest] = process.argv;
    const prelimNoColor = rest.includes("--no-color") || Boolean(process.env.NO_COLOR);
    if (rest.includes("--help") || rest.includes("-h")) {
        printHelp(prelimNoColor);
        process.exit(0);
    }
    const parsed = parseArgs(rest);
    if (!parsed) {
        printHelp(prelimNoColor);
        process.exit(1);
    }
    const C = colorize(!parsed.noColor);
    const { bold: b, cyan: cy, green: gr, red: rd, yellow: y, gray: g, reset: r, } = C;
    const parent = parseArg(parsed.parent);
    const child = parseArg(parsed.child);
    if (!parent || !child) {
        printHelp(parsed.noColor);
        process.exit(1);
    }
    const result = await findCompatibleVersion({
        parentPackage: parent.name,
        parentMinVersion: parent.version || "",
        childPackage: child.name,
        childMinVersion: child.version || "",
        packageRemoved: parsed.removed,
    }, { silent: true });
    const spacer = () => console.log();
    spacer();
    if (result.success) {
        console.log(`${gr}${b}✔ Result${r}`);
        spacer();
        console.log(`${gr}${result.message}${r}`);
        if (result.version) {
            spacer();
            console.log(`${cy}${b}Earliest parent version:${r} ${b}${parent.name}@${result.version}${r}`);
        }
        if (result.details?.length) {
            spacer();
            console.log(`${cy}${b}Dependency occurrences (${result.details.length}):${r}`);
            for (const line of result.details)
                console.log(`${g}  ${line}${r}`);
        }
        spacer();
        process.exit(0);
    }
    else {
        console.error(`${rd}${b}✖ No compatible version found${r}`);
        spacer();
        console.error(`${rd}${result.message}${r}`);
        if (result.details?.length) {
            spacer();
            console.error(`${cy}${b}Details:${r}`);
            for (const line of result.details)
                console.error(`${g}  ${line}${r}`);
        }
        spacer();
        process.exit(2);
    }
}
run().catch((e) => {
    const noColor = Boolean(process.env.NO_COLOR);
    const C = colorize(!noColor);
    console.error(`${C.red}${C.bold}Unexpected error:${C.reset}`, e);
    process.exit(99);
});
