# Changesets

This folder holds [Changesets](https://github.com/changesets/changesets) for `hardhat-awesome-cli`.

## Contributor workflow

1. Make your change on a feature branch.
2. Add a new file under `.changeset/` (e.g. `my-change.md`) with:
   ```md
   ---
   "hardhat-awesome-cli": minor
   ---

   Short, user-facing description of the change.
   ```
   Use `major` for breaking changes, `minor` for new features, `patch` for
   bug fixes and chores.
3. Open the PR. CI does not fail on missing changesets — the maintainer
   triages them on merge.
4. On merge to `main`, the release workflow opens a "Version Packages" PR
   that bumps `package.json`, updates `CHANGELOG.md`, and removes the
   consumed changesets. Merging that PR cuts the GitHub Release and
   publishes to npm.

See `CONTRIBUTING.md` for the full contribution guide.
