# Merge Worktrees Command

Merge all feature branches from worktrees back into main, then validate.

## Steps

1. **Check current state**
   ```bash
   git worktree list
   git status
   ```

2. **Ensure we're on main/master in the main repo**
   ```bash
   git checkout master || git checkout main
   ```

3. **Merge each feature branch** (handle conflicts if any)
   - For each worktree branch, run: `git merge <branch-name> --no-ff -m "Merge <branch-name>"`
   - If conflicts occur, stop and report them to the user

4. **Run validation after merge**
   ```bash
   pnpm install        # In case deps changed
   pnpm typecheck      # Type errors = merge problem
   pnpm lint           # Code quality
   pnpm test           # Run tests if they exist
   ```

5. **Report results**
   - List what was merged
   - Show any validation errors
   - Suggest next steps (Phase 2 worktrees, or fix issues)

6. **Optionally clean up worktrees** (ask user first)
   ```bash
   git worktree remove ../worktree-name
   git branch -d feature/branch-name
   ```

## Usage

```
/merge-worktrees
```

## Notes

- Only merge branches that have commits ahead of main
- Always use `--no-ff` to preserve merge history
- Run typecheck BEFORE tests (faster failure)
- If any step fails, stop and report - don't continue blindly
