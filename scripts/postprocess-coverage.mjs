#!/usr/bin/env node
/**
 * Post-process the c8 coverage report so it is safe to upload as a
 * GitHub Actions artifact. The lcov reporter auto-generates an HTML
 * companion under `coverage/lcov-report/` and one of the synthetic
 * source files V8 emits for ESM module-level code is named
 * `<define:import.meta>.html`. GitHub's artifact uploader rejects
 * filenames containing `:`, `<`, `>`, `|`, `*`, `?`, `"`, `\r` or `\n`
 * (NTFS compatibility), so this script renames any offending file and
 * patches the sibling `index.html` to keep the local browsing view
 * usable.
 */

import { readdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const COVERAGE_DIR = 'coverage'
// Characters GitHub artifact upload refuses. See
// https://github.com/actions/toolkit/blob/main/packages/artifact/src/internal/shared-options.ts
const FORBIDDEN = /[:<>"|?*\r\n]/g
const REPLACEMENT = '_'

async function* walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) {
            yield* walk(path)
        } else if (entry.isFile()) {
            yield path
        }
    }
}

function safeName(name) {
    return name.replace(FORBIDDEN, REPLACEMENT)
}

const renamed = []
for await (const file of walk(COVERAGE_DIR)) {
    const base = file.split('/').pop()
    const next = safeName(base)
    if (next === base) continue
    const target = file.slice(0, -base.length) + next
    await rename(file, target)
    renamed.push([base, next])
}

// Patch sibling index.html href references so renamed files stay
// navigable when the report is opened locally.
for (const [original, replacement] of renamed) {
    const indexPath = join(COVERAGE_DIR, 'lcov-report', 'src', 'index.html')
    let html
    try {
        html = await readFile(indexPath, 'utf8')
    } catch {
        continue
    }
    // Match either the literal form or the HTML-entity-encoded form
    // (istanbul HTML-escapes `<` and `>` in source filenames).
    const encoded = original
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    const encodedNext = replacement
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    const patched = html
        .split(`"${original}"`).join(`"${replacement}"`)
        .split(encoded).join(encodedNext)
    if (patched !== html) {
        await writeFile(indexPath, patched, 'utf8')
    }
}

if (renamed.length === 0) {
    console.log('postprocess-coverage: no unsafe filenames found')
} else {
    for (const [from, to] of renamed) {
        console.log(`postprocess-coverage: renamed ${from} -> ${to}`)
    }
}