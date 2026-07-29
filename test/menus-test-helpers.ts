import inquirer from 'inquirer'

/**
 * Stub for the interactive menu tests (issue #162).
 *
 * `serveInquirer`'s helpers were extracted into focused modules under
 * `src/menus/`, but the menu code still calls `inquirer.prompt(<questions>)`
 * directly. To drive the menu functions without a human at the terminal we
 * replace `inquirer.prompt` with a stub that returns the next scripted
 * answer on every call.
 *
 * The default behaviour covers the most common shape — a single inquirer
 * prompt that resolves to the next answer in the script. Callers can pass
 * a `resolver` to handle multi-prompt arrays, or to return a custom object
 * shape from the prompt (some menus spread answers across several
 * `name`/`value` pairs in the same `prompt(...)` call).
 */
export interface InquirerStub {
    /**
     * List of every question set passed to `inquirer.prompt`, in call order.
     * Lets the tests assert what the menu actually offered the user.
     */
    readonly prompts: any[][]
    /**
     * Answers that were actually returned by the stub, in call order. Useful
     * for asserting that the menu asked the expected number of questions.
     */
    readonly answers: any[]
    /**
     * Restore the original `inquirer.prompt`. Always called in `afterEach`,
     * but exposed so a single test can opt out of the shared restore hook.
     */
    restore(): void
}

/**
 * Replace `inquirer.prompt` with a stub that returns the next scripted
 * answer on each call and records the questions it was shown.
 *
 * `answers` is consumed in order; passing too few answers throws a clear
 * error so a missing script does not silently fall through to the next
 * prompt and produce a misleading assertion failure.
 *
 * Wrapping rule:
 * - Array answers are wrapped under the first question's name. This
 *   matches the checkbox shape used by every multiple-selection prompt in
 *   the codebase (`serveExcludeFileSelector`, `serveSettingSelector`'s
 *   chain selector, …).
 * - Plain object answers are returned as-is, so a menu that asks for
 *   several values in one prompt (e.g. `serveCustomCommandManager`'s add
 *   form) can return a single object keyed by every question name.
 * - Scalar answers are wrapped under the first question's name, matching
 *   the single-prompt menus used by `serveFileListSelector` and friends.
 *
 * `resolver` is the answer-shape escape hatch: when present it is called
 * with `(callIndex, questionArray)` and must return the full answer
 * object. It is used by tests that need a different mapping than the
 * default wrapping rule above.
 */
export const stubInquirer = (answers: any[], resolver?: (call: number, questions: any[]) => any): InquirerStub => {
    const originalPrompt = inquirer.prompt
    const prompts: any[][] = []
    const usedAnswers: any[] = []
    let call = 0
    ;(inquirer as any).prompt = async (questions: any[]) => {
        prompts.push(questions)
        const questionArray = Array.isArray(questions) ? questions : [questions]
        if (resolver) {
            const result = resolver(call, questionArray)
            usedAnswers.push(result)
            call += 1
            return result
        }
        const answer = answers[call]
        call += 1
        if (answer === undefined)
            throw new Error(
                `inquirer.prompt was called more times than expected (received ${call} calls, script has ${answers.length})`
            )
        usedAnswers.push(answer)
        const firstName = questionArray[0]?.name
        if (firstName === undefined) return answer
        if (Array.isArray(answer)) return { [firstName]: answer }
        if (answer !== null && typeof answer === 'object') return answer
        return { [firstName]: answer }
    }
    return {
        prompts,
        get answers() {
            return usedAnswers
        },
        restore() {
            ;(inquirer as any).prompt = originalPrompt
        }
    }
}

/**
 * Convenience hook: installs `stubInquirer` before every test in the
 * surrounding `describe` and restores the original `inquirer.prompt` after
 * each one. Callers usually just `return stubInquirerPrompt(...)` and use
 * the returned `InquirerStub` directly.
 */
export const useInquirerStub = (answers: any[], resolver?: (call: number, questions: any[]) => any): InquirerStub => {
    const stub = stubInquirer(answers, resolver)
    afterEach(() => stub.restore())
    return stub
}
