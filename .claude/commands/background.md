# Background Tasks

Run Claude tasks in the background while you continue working.

## What This Does

Background tasks allow you to:
- Start a long-running task
- Continue working on other things
- Get notified when the task completes
- Review results when ready

## Quick Reference

| Action | Command/Key |
|--------|-------------|
| Background current task | **Ctrl+B** |
| List background tasks | `/tasks` |
| Check task output | Read the output file path |
| Disable background tasks | Set `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` |

## How to Use

### 1. Start a Task

Give Claude a task as usual:
```
Analyze all TypeScript files and create a report of potential performance issues.
```

### 2. Background It

While Claude is working, press **Ctrl+B**.

Claude will:
- Continue working in the background
- Show you an output file path
- Notify you when complete

### 3. Continue Working

You can now:
- Start new conversations
- Work on other tasks
- Come back later

### 4. Check Progress

```
/tasks
```

Shows all running background tasks with their status.

### 5. Get Results

When notified of completion, read the output file:
```
Read the file at [output path]
```

## Subagents as Background Tasks

When delegating to subagents, they can run in the background:

```
Delegate to verify-app agent in background: Run the full test suite and report results.
```

The subagent will:
- Run in its own context
- Inherit your permissions
- Auto-deny any permissions it doesn't have
- Continue even if permission is denied (tries alternatives)
- Return results when complete

## Permissions

Background agents inherit parent permissions. If a background task needs a permission it doesn't have:
- The tool call fails
- The agent continues with alternative approaches
- No blocking prompts (would defeat the purpose)

## Best Use Cases

- Long test suites
- Large file analysis
- Code generation across many files
- Documentation generation
- Build processes

## Example Workflow

```
# Start analysis task
> Analyze the entire codebase for security vulnerabilities

# Background it (Ctrl+B)
[Task backgrounded - output at /tmp/claude/task-abc123.output]

# Start a new task
> Help me fix this bug in auth.ts

# Check on background task later
/tasks

# Read results when done
> Read /tmp/claude/task-abc123.output
```

## Disable Background Tasks

If you prefer synchronous operation:

```bash
export CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1
claude
```

This disables:
- Ctrl+B shortcut
- Auto-backgrounding
- All background task functionality

## Arguments

$ARGUMENTS can specify:
- Task to background immediately
- Output location preference

## Example Usage

```
/background "Run full test suite"
/tasks
/tasks details
```
