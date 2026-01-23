# Teleport - Session Handoff

Transfer your Claude Code session between CLI, web, and mobile.

## What This Does

Teleportation allows you to:
- Start a task on your desktop CLI
- Transfer it to the cloud (claude.ai)
- Monitor/continue from your phone
- Transfer back to local when ready

This enables true "fire and forget" workflows where you can start long tasks and check on them remotely.

## Built-in Commands

### Send to Cloud

```
/teleport
```

This transfers your current session to claude.ai/code where you can:
- Monitor progress from any browser
- Continue the conversation
- Check back from mobile

### Configure Remote Environment

```
/remote-env
```

Set up the remote environment with necessary:
- Environment variables
- API keys
- Configuration

## CLI Flags

### Start with Teleport Enabled

```bash
# Start session ready for teleport
claude --teleport

# Start in background and teleport
claude --teleport &
```

### Background + Teleport

```bash
# Start a long task, send to cloud, continue locally
claude myproject --teleport &
```

## Workflow Examples

### Example 1: Start Refactor, Check from Phone

```bash
# 1. Start the task locally
claude

# 2. Give Claude a big task
> Refactor all API endpoints to use the new validation middleware

# 3. Teleport to cloud
/teleport

# 4. Close laptop, check from phone at claude.ai/code
```

### Example 2: Parallel Cloud Sessions

Run 5-10 sessions in the cloud simultaneously:

```bash
# Terminal 1 - Local
claude --teleport &

# Terminal 2 - Local
claude --teleport &

# Now you have sessions running in the cloud
# Monitor all at claude.ai/code
```

### Example 3: Mobile Monitoring

1. Start task on desktop
2. `/teleport` to cloud
3. Open Claude app on phone
4. Navigate to claude.ai/code
5. Check progress, provide input if needed
6. Return to desktop, teleport back if desired

## Integration with Ralph Wiggum

Combine teleport with autonomous loops:

```bash
# Start autonomous task
/ralph-wiggum "Complete the data migration"

# Teleport to cloud
/teleport

# Check progress from anywhere
# The task continues running in the cloud
```

## Tips

1. **Use for long-running tasks** - Teleport is most useful when tasks take 10+ minutes

2. **Set up notifications** - Configure claude.ai to notify you when tasks need input

3. **Combine with Git worktrees** - Each teleported session can work on a separate branch

4. **Check token usage** - Cloud sessions still consume your API quota

## Arguments

$ARGUMENTS can specify:
- Session name/identifier
- Destination (if multiple sessions)

## Example Usage

```
/teleport
/teleport "refactor-session"
/remote-env
```
