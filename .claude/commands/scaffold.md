# Scaffold - Initialize Claude Workflow

Set up Claude Code workflow infrastructure in the current project.

## Available Scaffolds

### `init` - Full Setup
Initialize complete Claude workflow structure:
- CLAUDE.md (project instructions)
- .claude/settings.json (permissions)
- .claude/commands/ (slash commands)
- .claude/agents/ (subagents)

### `command <name>` - Add Command
Create a new slash command template.

### `agent <name>` - Add Subagent
Create a new subagent definition.

### `hooks` - Add Hooks
Configure PostToolUse hooks for auto-formatting.

### `mcp <service>` - Add MCP Integration
Add MCP server configuration for external services.

## Process for `init`

1. **Check Existing Setup**
   - Look for existing .claude/ directory
   - Look for existing CLAUDE.md
   - Warn if overwriting

2. **Detect Project Type**
   - Check for package.json → Node/TypeScript
   - Check for pyproject.toml → Python
   - Check for Cargo.toml → Rust
   - Check for go.mod → Go

3. **Generate Configuration**
   - Copy appropriate CLAUDE.md template
   - Create .claude/settings.json with permissions
   - Create essential commands
   - Create essential agents

4. **Customize**
   - Replace {{placeholders}} with project info
   - Adjust permissions for detected tooling
   - Add project-specific instructions

## Output Structure

```
project/
├── CLAUDE.md                    # Project instructions
├── .claude/
│   ├── settings.json           # Permissions & hooks
│   ├── commands/
│   │   ├── commit-push-pr.md
│   │   ├── catchup.md
│   │   ├── test-fix.md
│   │   └── plan.md
│   └── agents/
│       ├── verify-app.md
│       └── code-simplifier.md
└── .mcp.json                    # (optional) MCP config
```

## Arguments

$ARGUMENTS specifies what to scaffold:
- `init` - Full initialization
- `init --force` - Overwrite existing
- `command commit-push-pr` - Add specific command
- `agent security-reviewer` - Add specific agent
- `mcp slack` - Add Slack MCP integration

## Example Usage

```
/scaffold init
/scaffold command "deploy"
/scaffold agent "doc-writer"
/scaffold mcp postgres
```
