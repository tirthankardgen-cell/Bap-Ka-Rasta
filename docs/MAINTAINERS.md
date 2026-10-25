# Maintainer Guide

This guide records the repository profile, automation, and publication workflow. Follow the [contribution guide](../CONTRIBUTING.md) and [security policy](../SECURITY.md) when reviewing changes.

## Repository profile

Use the following values in the repository's **About** panel. Updating these fields requires a GitHub account or integration with the appropriate repository-settings permissions; permission to push files alone is not sufficient.

**Description**

> A browser-based Indian street-driving game built with React, TypeScript, and Three.js. Explore Mumbai-inspired roads in an auto rickshaw with keyboard or touch controls.

**Website**

[https://bap-ka-rasta.vercel.app](https://bap-ka-rasta.vercel.app)

**Topics**

```text
browser-game, driving-game, indie-game, mumbai, india, react,
typescript, threejs, vite, webgl, web-audio, single-player
```

The existing website is verified. The maintenance connection could push repository files but GitHub rejected updates to the description, topics, and private vulnerability-reporting setting. The values above are ready to apply through GitHub's About editor; they should not be treated as confirmed live settings until saved there.

## Community files

- [CONTRIBUTING.md](../CONTRIBUTING.md) defines the contributor workflow.
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) defines community expectations and moderation contact.
- [SECURITY.md](../SECURITY.md) provides the private vulnerability contact and review boundary.
- [SUPPORT.md](../SUPPORT.md) directs bugs, feature proposals, and usage questions.
- [NOTICE.md](../NOTICE.md) records the current unlicensed code status and third-party attribution.
- [Issue forms](../.github/ISSUE_TEMPLATE/) and the [PR template](../.github/PULL_REQUEST_TEMPLATE.md) structure incoming contributions.

Keep the reporting contact current. GitHub private vulnerability reporting can be enabled in [repository security settings](https://github.com/tirthankardgen-cell/Bap-Ka-Rasta/settings/security_analysis) by a suitably authorized maintainer. If enabled, update the policy and issue-template contact link together after confirming the reporting form works.

## Continuous integration

The [CI workflow](../.github/workflows/ci.yml) runs on pull requests and pushes to `main`, and can be started manually from GitHub Actions. It installs the locked npm dependencies, runs simulation/layout tests, builds the production app, and verifies research-audio hashes and attribution.

CI uses Node.js 24 and Python 3.12, a read-only contents token, immutable action revisions, and no deployment secrets. Review both the code and upstream release notes when changing action revisions. The workflow does not deploy the site.

Run the Playwright suite separately for UI, runtime, audio, or input changes. The desktop pause-display timing failure remains open; do not add skips or ignore a failure to present a green build.

If checks are later made mandatory through branch protection, use the actual check name **Build, tests, and audio**. Branch protection is a repository-owner setting and is not configured by these files.

## Dependency maintenance

[Dependabot](../.github/dependabot.yml) is configured for weekly npm and GitHub Actions updates. Updates still require review; there is no automatic merge policy. Review compatibility, release notes, security advisories, and the lockfile diff. Keep Node requirements in `package.json`, `.nvmrc`, the README, and CI consistent.

## Before publishing a change

1. Confirm the intended scope and review changes to runtime behavior, assets, and credits.
2. Run relevant checks and retain any failure details or validation limits in the pull request.
3. Update the current guides and the Unreleased changelog when behavior or setup changes.
4. Build with `npm run build` and inspect `dist/` using the preview server when the application changes.
5. Verify that original research recordings, private settings, and temporary files have not entered the served bundle.
6. Review the resulting deployment if the repository is connected to Vercel.

The package version `0.1.0` identifies the prototype; it is not evidence of a published release. Create version tags or GitHub releases only when intentionally publishing one. Document a release's actual scope and validation rather than copying future roadmap items into its notes.
