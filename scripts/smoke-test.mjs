#!/usr/bin/env node
/**
 * Consumer smoke test.
 *
 * Unit tests load the plugin from source (`src/`). This script packs the
 * package, installs it into a clean Hardhat 3 fixture, and asserts that the
 * published layout can be loaded by Hardhat and that the `cli` task is
 * registered. CI runs this so a broken published layout fails before release.
 *
 * Layout:
 *   test/fixtures/smoke/   - minimal HH3 consumer project (committed)
 *   scripts/smoke-test.mjs - this script (runs the install + assertions)
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..')
const fixtureSrc = join(repoRoot, 'test', 'fixtures', 'smoke')

function step(msg) {
    process.stdout.write(`\n› ${msg}\n`)
}

function run(cmd, args, opts = {}) {
    const display = `${cmd} ${args.join(' ')}`
    process.stdout.write(`  $ ${display}\n`)
    const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
    if (result.error) {
        console.error(`✗ spawn error: ${result.error.message}`)
        process.exit(1)
    }
    if (result.status !== 0) {
        console.error(`✗ command failed (exit ${result.status}): ${display}`)
        process.exit(result.status ?? 1)
    }
}

const cleanup = []
function trackForCleanup(dir) {
    cleanup.push(dir)
}

function cleanupAll() {
    for (const dir of cleanup) {
        rmSync(dir, { recursive: true, force: true })
    }
}

process.on('exit', cleanupAll)
process.on('SIGINT', () => {
    cleanupAll()
    process.exit(130)
})

// 1. Build so dist/ matches what npm pack would ship.
step('Building package (tsc)')
run('npm', ['run', 'build'], { cwd: repoRoot })

// 2. Pack the package into a temp directory.
step('Packing package')
const packDir = mkdtempSync(join(tmpdir(), 'hha-cli-pack-'))
trackForCleanup(packDir)
run('npm', ['pack', '--pack-destination', packDir], { cwd: repoRoot })

const tarballs = readdirSync(packDir).filter((f) => f.endsWith('.tgz'))
if (tarballs.length === 0) {
    console.error('✗ npm pack produced no tarball')
    process.exit(1)
}
const tarball = join(packDir, tarballs[0])
process.stdout.write(`  tarball: ${tarball}\n`)

// 3. Stage a copy of the fixture into a temp directory so we don't pollute
//    the repo with a node_modules tree.
step('Staging fixture')
const stageDir = mkdtempSync(join(tmpdir(), 'hha-cli-smoke-'))
trackForCleanup(stageDir)
cpSync(fixtureSrc, stageDir, { recursive: true })

// 4. Install the tarball + its peer (hardhat) into the fixture.
step('Installing plugin into fixture')
run(
    'npm',
    [
        'install',
        '--no-audit',
        '--no-fund',
        '--loglevel=error',
        `hardhat-awesome-cli@${tarball}`
    ],
    { cwd: stageDir }
)

// 5a. Load hardhat inside the fixture and assert the `cli` task is registered.
//     This catches problems where the published `exports` map, plugin entry,
//     or hook handlers can't be resolved by Hardhat's plugin loader.
step('Asserting plugin loads and `cli` task is registered')
const loadCheck = `
    import hardhat from 'hardhat'
    const task = hardhat.tasks.getTask('cli')
    if (!task) {
        console.error('cli task not registered')
        process.exit(1)
    }
    console.log('cli task id: ' + task.id.join(':'))
    // Also confirm the resolved config picked up the plugin's paths.cli hook.
    if (hardhat.config.paths.cli === undefined) {
        console.error('paths.cli was not injected by the config hook')
        process.exit(1)
    }
    console.log('paths.cli: ' + hardhat.config.paths.cli)
`
run(process.execPath, ['--input-type=module', '-e', loadCheck], { cwd: stageDir })

// 5b. Invoke the installed `hardhat` binary's `--help` for the `cli` task so
//     we know the CLI starts and prints help (catches runtime import errors
//     in the lazy action module without running the interactive menu).
//
//     Hardhat 3 requires Node >= 22.13; on older Nodes (e.g. local dev with
//     Node 20) the binary will refuse to start with a version error. The
//     task-registration check above already covers the load path, so we
//     skip this step on too-old Nodes rather than fail the whole smoke.
const hhBin = join(stageDir, 'node_modules', '.bin', 'hardhat')
if (!existsSync(hhBin)) {
    console.error(`✗ hardhat binary not found at ${hhBin}`)
    process.exit(1)
}
const nodeMajor = Number(process.versions.node.split('.')[0])
const nodeMinor = Number(process.versions.node.split('.')[1])
const nodeOk = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 13)
if (!nodeOk) {
    process.stdout.write(
        `  ! Skipping \`hardhat cli --help\` (current Node ${process.versions.node} is below Hardhat 3's minimum of 22.13). The task-registration check above already exercises the load path.\n`
    )
} else {
    step('Running `hardhat cli --help` in fixture')
    run(hhBin, ['cli', '--help'], { cwd: stageDir })
}

// 6. Done.
process.stdout.write('\n✓ Smoke test passed\n')