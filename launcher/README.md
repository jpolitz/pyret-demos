# Pyret "Work on GitHub" launcher — test build

Live: https://jpolitz.github.io/pyret-demos/launcher/

A development build of the Pyret VS Code extension (`PyretProgrammingLanguage.pyret-parley`,
version `0.44.100`) that adds clipboard import for the launcher repository
[jpolitz/pyret-launcher](https://github.com/jpolitz/pyret-launcher). The design notes are in
`everything/projects/pyret/undrive.md`.

## Contents

- `index.html`: the release page. Its **Work on GitHub** button does what the code.pyret.org button
  would do: it copies the program, then opens `https://vscode.dev/github/jpolitz/pyret-launcher`.
- `pyret-parley-0.44.100.vsix`: the packaged extension.
  SHA-256 `cfef75813ac74b131cd6bf8dc44e3307e2641622095d04376a163378c4a2210b`.
- No unpacked copy. vscode.dev's Content Security Policy (`connect-src`) allows only `localhost` and
  Microsoft/Marketplace hosts, so **Install Extension from Location** can't load from GitHub Pages
  ("Cannot find a valid extension from the location"). vscode.dev also has no Install-from-VSIX command.
  Testers unzip the VSIX and serve `extension/` with `npx serve@14.2.4 --cors -l 5123`, then install from
  `http://localhost:5123/`. Chrome asks for local-network access the first time.

## Provenance

- Source: `jpolitz/pyret-lang@1006cb831` on branch `vscode-launcher-import` (`vscode/src/launcher.ts`).
- Built 2026-11-18 from `vscode/` with
  `npx vsce package 0.44.100 --no-update-package-json --no-git-tag-version`.
  `vscode:prepublish` recompiles `dist/` first. The editor assets come from the `code.pyret.org/build`
  symlink at the time of the build.
- `package.json` in the repo still says `0.44.0`. The `.100` exists only in this build, so it sorts above the
  Marketplace release.

## Verified

- Before packaging: Playwright against VS Code for the Web 1.129.1 (`@vscode/test-web`), with the launcher
  fixture loaded as the workspace. Checked: the preview is shown, the editor's contents match the clipboard
  exactly, a reload with the same clipboard doesn't prompt, and new clipboard text prompts again.
- Install from `http://localhost:5123/` (served by `npx serve@14.2.4 --cors`) succeeds on real vscode.dev in
  headless Chromium with local-network access granted. The extension was installed into a bare vscode.dev window.
- **Not verified:** the import prompt on real vscode.dev, since opening the launcher repo needs a GitHub login, and whether the prompt appears right after
  installing without a reload.
