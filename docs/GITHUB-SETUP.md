# GitHub setup and protected-main policy

## Repository decision

Create a **public** GitHub repository named `civra` once the remote is ready. Public source is part of the trust model; do not publish model files, local chats, build artifacts, credentials, or research caches.

## Connect the local repository

After creating the empty repository on GitHub, run these commands from the Civra directory, replacing the placeholder with the repository URL:

```powershell
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Then every change happens on a branch:

```powershell
git switch -c feat/short-description
```

## GitHub configuration required after the first push

In **Settings → Branches**, create a branch-protection rule (or ruleset) for `main` with:

- Require a pull request before merging.
- Require the `Context and project checks` status check to pass.
- Block direct pushes to `main` (including administrators if practical).
- Require branches to be up to date before merging when contributors increase.

GitHub owns remote enforcement. The local hook in `.githooks/pre-commit` is a second line of defense and requires `CONTEXT.md` to be staged with every substantive commit.

## First clone

After cloning, configure the versioned hooks once:

```powershell
./scripts/setup-git-hooks.ps1
```
