# Checkpoint & Rewind

Manage code state checkpoints for safe experimentation.

## What This Does

Claude Code automatically saves checkpoints before making changes. You can:
- See what changed
- Rewind to any previous state
- Experiment without fear

This is your safety net for ambitious, autonomous tasks.

## Quick Reference

| Action | Command/Key |
|--------|-------------|
| Rewind to last checkpoint | **Esc Esc** (press twice) |
| Rewind via command | `/rewind` |
| See changes since checkpoint | `/diff` |

## How It Works

### Automatic Checkpoints

Before Claude modifies any file, it:
1. Saves the current state
2. Records what's about to change
3. Makes the change
4. You can rewind if needed

### Manual Rewind

Press **Esc twice** quickly to:
1. Stop current operation
2. Revert all changes since last checkpoint
3. Return to known-good state

Or use the command:
```
/rewind
```

## Use Cases

### 1. Risky Refactoring

```
> Refactor the entire auth module to use the new pattern

[Claude makes many changes]
[Something breaks]

[Press Esc Esc]
[Back to before the refactor]

> Let's try a different approach...
```

### 2. Autonomous Tasks

When using Ralph Wiggum mode or long autonomous tasks:
- Checkpoints save state between iterations
- If the agent goes off track, rewind
- Start again with better instructions

### 3. Exploratory Coding

```
> Try implementing this with approach A

[Review results]

/rewind

> Now try approach B

[Compare which is better]
```

### 4. Learning & Experimentation

Let Claude try things without commitment:
- "Try adding caching here"
- Review the changes
- Rewind if you don't like it
- Or keep it if you do

## Best Practices

### 1. Checkpoint Before Big Changes

If you're about to ask Claude to make sweeping changes:
- Note that you can rewind
- Proceed with confidence
- Rewind if needed

### 2. Review Before Committing

After Claude makes changes:
```
/diff
```
See exactly what changed before you `git commit`.

### 3. Combine with Git

Checkpoints are session-based. For persistent safety:
```
git stash        # Extra safety
[Let Claude work]
git stash pop    # If you need to revert
```

### 4. Use for A/B Comparisons

```
> Implement feature using Redux

[Save mental note of state]

/rewind

> Implement feature using Zustand

[Compare the two approaches]
```

## Limitations

- Checkpoints are session-based (not persisted)
- Only covers file changes (not external systems)
- Database changes, API calls, etc. are NOT rewound
- Use in sandbox for truly reversible experimentation

## Arguments

$ARGUMENTS can specify:
- How many steps to rewind
- Specific checkpoint to restore

## Example Usage

```
/rewind
/rewind 2
/diff
/checkpoint list
```

## Integration with Workflow

### Plan Mode + Checkpoints

1. `/plan` - Design the approach
2. Execute the plan
3. Checkpoint saves each step
4. Rewind if a step goes wrong
5. Adjust and continue

### Ralph Wiggum + Checkpoints

1. Start autonomous loop
2. Each iteration creates checkpoint
3. If loop goes off track, Ctrl+C and rewind
4. Restart with refined instructions
