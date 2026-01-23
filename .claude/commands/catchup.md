# Catch Up on Recent Changes

Summarize recent Git activity to understand what has changed.

## Steps

1. Run `git log --oneline -20` to see recent commits
2. Run `git diff main...HEAD --stat` to see files changed on this branch
3. If on main, run `git log --since="1 week ago" --oneline`
4. Identify key changes:
   - New files added
   - Files significantly modified
   - Patterns in commit messages
5. Summarize findings in clear, organized format

## Output Format

```
## Recent Activity Summary

### Branch: [current-branch]
- Commits since diverging from main: X
- Files changed: Y

### Key Changes
1. [Area/Feature]: [Description]
2. [Area/Feature]: [Description]

### Notable Commits
- [hash] [message] - [why it matters]

### Files to Review
- path/to/important/file.ts - [reason]
```

## Arguments

$ARGUMENTS can specify:
- Time range: "last 3 days", "this week"
- Specific path: "src/components"
- Branch to compare: "develop"

## Example Usage

```
/catchup
/catchup "last 3 days"
/catchup "src/api"
```
