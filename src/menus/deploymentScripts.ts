import buildDeploymentContract, { formatAddDeploymentScriptFlag } from '../buildDeploymentContract.ts'
import { buildContractsList } from '../buildFilesList.ts'
import { displayFinalCliCommand, waitForReadability } from '../utils.ts'
import { serveFileListSelector } from './fileSelector.ts'

export const serveDeploymentContractCreatorSelector = async () => {
    // Pick the contract the user wants to deploy. We reuse the contracts
    // listing (which already excludes files the user has marked as
    // excluded in settings) so the menu feels consistent with every other
    // contract pick in the CLI.
    const contractSelected = await serveFileListSelector(
        'Select a contract to generate a deployment script for',
        async (subPath: string) => {
            const contractsFilesObject = await buildContractsList(subPath)
            return contractsFilesObject
        }
    )
    if (!contractSelected || contractSelected === 'back') return
    if (contractSelected.type !== 'file') return

    // The file selector strips the `.sol` extension in its display name
    // (see `formatFileName` in buildFilesList.ts), so the file path still
    // carries the extension and we just take it as-is.
    const contractName = contractSelected.filePath.replace(/\.sol$/, '')
    const writtenPath = await buildDeploymentContract(contractName)
    if (writtenPath) {
        displayFinalCliCommand('addDeploymentScript', contractName)
        await waitForReadability()
    }
}

/**
 * Generate a deployment script from a CLI flag (issue #166).
 *
 * Skips the inquirer prompts so the flag stays scriptable. The flag value
 * is parsed via `parseAddDeploymentScriptFlag`; a malformed value aborts
 * the operation with a yellow warning rather than throwing.
 */
export const runAddDeploymentScript = async (contractName: string, constructorArgs: string[]): Promise<void> => {
    const writtenPath = await buildDeploymentContract(contractName, { customName: contractName, constructorArgs })
    if (writtenPath)
        displayFinalCliCommand('addDeploymentScript', formatAddDeploymentScriptFlag(contractName, constructorArgs))
}
