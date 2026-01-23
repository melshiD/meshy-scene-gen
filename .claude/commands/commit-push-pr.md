# Commit, Push, and Create PR

Automate the full Git workflow from staged changes to pull request.

## Steps

1. Run `git status` to see current changes
2. Run `git diff --staged` to review what will be committed
3. If nothing staged, stage appropriate files with `git add`
4. Create a commit with a descriptive conventional commit message:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `refactor:` for code restructuring
   - `docs:` for documentation
   - `test:` for test changes
   - `chore:` for maintenance
5. Push to remote with `git push -u origin HEAD`
6. Create a pull request using `gh pr create`

## PR Description

Include in the PR body:
- Summary of changes (2-3 bullet points)
- Any breaking changes
- Testing done
- Related issues (if any)

## Arguments

$ARGUMENTS will be used as additional context for the commit message or PR title.

## Example Usage

```
/commit-push-pr "Add user authentication flow"
/commit-push-pr "Fix #123 - resolve login timeout"
```
