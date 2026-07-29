// Flat config — replaces the legacy .eslintrc.js + tslint.json pair.
// TypeScript files are parsed through @babel/eslint-parser so the linter
// doesn't depend on the typescript-eslint compiler API (which still
// chokes on TypeScript 7). Formatting decisions are deferred to Prettier
// via eslint-config-prettier.
import js from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            'src/mockContracts/testForge/**',
            // The smoke fixture is a self-contained HH3 consumer project
            // (imports the plugin from its published subpath). It's parsed
            // by Hardhat's config loader, not by tsc or eslint.
            'test/fixtures/**'
        ]
    },
    js.configs.recommended,
    prettierConfig,
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: babelParser,
            parserOptions: {
                requireConfigFile: false,
                babelOptions: {
                    babelrc: false,
                    configFile: false,
                    parserOpts: {
                        plugins: ['typescript']
                    }
                }
            },
            globals: {
                ...globals.node,
                ...globals.mocha
            }
        },
        rules: {
            // Mirror the spirit of the previous tslint config: stay lenient
            // on style and disable checks that conflict with this codebase.
            'no-console': 'off',
            'no-empty': 'off',
            'no-unused-vars': 'off',
            'no-useless-assignment': 'off',
            'no-fallthrough': 'off',
            'no-inner-declarations': 'off'
        }
    },
    {
        // TypeScript-only relaxations: babel-eslint-parser doesn't know
        // about TS type bindings, so types/interfaces look like undeclared
        // identifiers to the default rules.
        files: ['**/*.{ts,mts,cts}'],
        rules: {
            'no-undef': 'off'
        }
    }
]