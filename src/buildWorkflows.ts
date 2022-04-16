import fs from 'fs'

const buildWorkflows = async (workflowName: string) => {
    if (fs.existsSync('.github')) {
        if (!fs.existsSync('.github/workflows')) fs.mkdirSync('.github/workflows')
    } else {
        fs.mkdirSync('.github')
        fs.mkdirSync('.github/workflows')
    }
    let workflowFile: string = ''
    let workflowInstall: string = ''

    if (workflowName === 'NPM - Hardhat - Test & Coverage') {
        workflowFile = 'hardhat'
        workflowInstall = 'npm'
    }
    if (workflowName === 'NPM - Foundry - Forge Test') {
        workflowFile = 'foundry'
        workflowInstall = 'npm'
    }
    if (workflowName === 'Yarn - Hardhat - Test & Coverage') {
        workflowFile = 'hardhat'
        workflowInstall = 'yarn'
    }
    if (workflowName === 'Yarn - Foundry - Forge Test') {
        workflowFile = 'foundry'
        workflowInstall = 'yarn'
    }

    if (workflowFile && workflowInstall) {
        if (!fs.existsSync('.github/workflows/' + workflowFile + '.yml')) {
            if (workflowFile === 'hardhat') {
                fs.writeFileSync(
                    '.github/workflows/' + workflowFile + '.yml',
                    `name: Run Hardhat Test

on: [push]

jobs:
    test_hardhat:
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v3
        with:
            node-version: 16
        - name: ${workflowInstall === 'npm' ? 'NPM Clean Install' : 'Yarn Install'}
        run: ${workflowInstall === 'npm' ? 'npm ci' : 'yarn'}
        - name: Run All Hardhat Tests
        run: npx hardhat test
        - name: Run hardhat coverage on all Test
        run: npx hardhat coverage`
                )
            }
            if (workflowFile === 'foundry') {
                fs.writeFileSync(
                    '.github/workflows/' + workflowFile + '.yml',
                    `name: Run Foundry Test

on: [push]

jobs:
    test_foundry:
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v3
        with:
            node-version: 16
        - name: Install Foundry
        uses: onbjerg/foundry-toolchain@v1
        with:
            version: nightly
        - name: ${workflowInstall === 'npm' ? 'NPM Clean Install' : 'Yarn Install'}
        run: ${workflowInstall === 'npm' ? 'npm ci' : 'yarn'}
        - name: Run Forge Test
        run: forge test`
                )
            }
            console.log('\x1b[32m%s\x1b[0m', 'Creating workflow ' + workflowName + ' in .github/workflows/' + workflowFile + '.yml')
        } else console.log('\x1b[33m%s\x1b[0m', 'The workflow ' + workflowName + ' already exists at .github/workflows/' + workflowFile + '.yml')
    }
}

export default buildWorkflows
