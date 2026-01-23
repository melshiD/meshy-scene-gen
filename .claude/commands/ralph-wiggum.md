# Ralph Wiggum Mode - Autonomous Task Loop

Run Claude in an autonomous loop until the task is complete.

## What This Does

Ralph Wiggum mode allows Claude to work continuously on a task without stopping, iterating until all acceptance criteria are met. Named after the Simpsons character known for naive persistence.

## Prerequisites

Install the official plugin first:
```
/plugin marketplace add anthropics/claude-code
/plugin install ralph-wiggum@claude-plugins-official
```

## Usage

### With Official Plugin

```
/ralph-wiggum "$ARGUMENTS"
```

The plugin will:
1. Accept your task description
2. Run Claude in a loop
3. Re-prompt after each completion
4. Continue until acceptance criteria are met

### DIY Shell Loop (Alternative)

If the plugin isn't available, use a shell loop:

```bash
# Create PROMPT.md with your task
cat << 'EOF' > PROMPT.md
## Task
$ARGUMENTS

## Acceptance Criteria
- All tests pass
- No type errors
- Build succeeds

## Instructions
Continue working on this task. Check git status and test results to see progress.
If all acceptance criteria are met, output "TASK COMPLETE" and stop.
EOF

# Run the loop
while :; do cat PROMPT.md | claude; done
```

## Safety Guidelines

### CRITICAL: Always use these safeguards

1. **Run in a sandbox/container**
   ```bash
   # Use Docker or isolated environment
   docker run -it --rm -v $(pwd):/app node:20 bash
   ```

2. **Use appropriate permission flags**
   ```bash
   claude --permission-mode=dontAsk  # Only in sandbox!
   ```

3. **Define clear completion criteria**
   - "Stop when all tests pass"
   - "Stop when build succeeds with no errors"
   - "Stop after processing all 100 files"

4. **Set resource limits**
   - Monitor token usage
   - Set iteration limits if possible
   - Be prepared to Ctrl+C

## Arguments

$ARGUMENTS should include:
- Clear task description
- Specific acceptance criteria
- Definition of "done"

## Example Usage

```
/ralph-wiggum "Refactor all components to use TypeScript strict mode. Stop when npm run typecheck passes with zero errors."

/ralph-wiggum "Add unit tests to achieve 80% coverage. Stop when npm run test:coverage shows 80%+ coverage."

/ralph-wiggum "Migrate database schema from v1 to v2. Stop when all migration tests pass."
```

## Best Use Cases

- Large codebase refactors
- Batch migrations
- Test coverage improvement
- Documentation generation
- Data processing pipelines

## When NOT to Use

- Small features (overkill)
- Open-ended/subjective tasks (no clear stop condition)
- Production environments (too risky)
- Without clear acceptance criteria (infinite loop)

## Cost Warning

Autonomous loops can consume significant API credits:
- A 50-iteration loop on a large codebase: $50-100+
- Multi-hour runs: $200+

Monitor your usage and set spending limits.
