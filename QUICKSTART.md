# Supercharged Workflow - Quick Start Guide

> From zero to running parallel agents in minutes

---

## Step 0: Install Official Plugins (One-Time)

Before your first project, set up the official Anthropic plugins:

```bash
# Add marketplaces
/plugin marketplace add anthropics/claude-plugins-official
/plugin marketplace add obra/superpowers-marketplace

# Install core plugins
/plugin install superpowers@superpowers-marketplace          # TDD + subagents
/plugin install feature-dev@claude-plugins-official          # Structured dev
/plugin install hookify@claude-plugins-official              # Easy hooks
/plugin install frontend-design@claude-plugins-official      # UI generation
/plugin install pr-review-toolkit@claude-plugins-official    # PR review
/plugin install claude-md-management@claude-plugins-official # CLAUDE.md maintenance

# Install LSP for your language (pick relevant ones)
/plugin install typescript-lsp@claude-plugins-official       # TypeScript/JS
/plugin install pyright-lsp@claude-plugins-official          # Python
```

**See [PLUGINS.md](../../PLUGINS.md) for full plugin guide.**

---

## Step 1: Create Project & Deploy Scaffold

```powershell
# Windows PowerShell
$project = "C:\projects\my-project"
$scaffold = "C:\Users\davem\Desktop\claude\supercharged-workflows"

mkdir $project
cd $project
git init

# Deploy scaffold (auto-detects project type)
& "$scaffold\setup.ps1" -TargetDir .
```

```bash
# Mac/Linux/WSL
project=~/projects/my-project
scaffold=~/supercharged-workflows

mkdir -p $project && cd $project
git init

# Deploy scaffold
$scaffold/setup.sh .
```

---

## Step 2: Customize CLAUDE.md

Edit the generated `CLAUDE.md` with your project specifics:

```markdown
# Project: [Your Project Name]

## Project Overview
[What are you building?]

## Tech Stack
[Languages, frameworks, databases]

## Core Features
- [ ] Feature 1
- [ ] Feature 2

## Architecture
[High-level system design]
```

**Tip**: The more context you provide, the better Claude performs.

---

## Step 3: Set Up Parallel Agents (Git Worktrees)

```bash
# Create isolated workspaces for each agent
git worktree add ../project-agent1 -b feature/task1
git worktree add ../project-agent2 -b feature/task2
git worktree add ../project-agent3 -b feature/task3
git worktree add ../project-agent4 -b feature/task4
git worktree add ../project-agent5 -b feature/task5
```

Each agent gets its own copy of the codebase to avoid conflicts.

---

## Step 4: Launch Agents

Open 5 terminal windows/tabs:

| Terminal | Command |
|----------|---------|
| 1 | `cd ../project-agent1 && claude` |
| 2 | `cd ../project-agent2 && claude` |
| 3 | `cd ../project-agent3 && claude` |
| 4 | `cd ../project-agent4 && claude` |
| 5 | `cd ../project-agent5 && claude` |

---

## Step 5: Give Each Agent a Task

### Planning First (Recommended)

Start each agent with a `/plan` command:

```
Read CLAUDE.md for project context.

Your task: [Specific task for this agent]

/plan "[Task description]"
```

### Example Task Distribution

| Agent | Task |
|-------|------|
| 1 | Backend API / Database |
| 2 | Frontend UI |
| 3 | Authentication |
| 4 | Testing / QA |
| 5 | DevOps / Infrastructure |

---

## Step 6: Monitor & Teleport

### Local Monitoring

Enable terminal notifications so you know when agents need input.

### Mobile Monitoring (Teleport)

Transfer a session to the cloud for phone access:

```
/teleport
```

Then open `claude.ai/code` on your phone to:
- Check progress
- Provide input
- Continue the conversation

Perfect for long-running tasks - start on desktop, monitor from anywhere.

---

## Step 7: Merge Completed Work

As agents finish:

```bash
cd /path/to/main/project
git merge feature/task1
git merge feature/task2
# Resolve conflicts if any
git push
```

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `/plan` | Enter planning mode |
| `/commit-push-pr` | Full git workflow |
| `/test-fix` | Run tests, fix failures |
| `/teleport` | Transfer to cloud/mobile |
| `/ralph-wiggum` | Autonomous loop mode |
| `Ctrl+B` | Background current task |
| `Esc Esc` | Rewind to checkpoint |

### Plugin Commands

| Command | Purpose |
|---------|---------|
| `/hookify [rule]` | Create hook rule from description |
| `/hookify:list` | List all hookify rules |
| `/revise-claude-md` | Capture session learnings to CLAUDE.md |
| `/feature-dev` | Structured 7-phase feature development |

### Plugin Auto-Activations

These plugins activate automatically on relevant tasks:
- **superpowers** → Feature work triggers TDD/brainstorming
- **frontend-design** → UI work triggers design skill
- **feature-dev** → Complex features trigger exploration

---

## Example: NFT Platform Startup

```powershell
# Create project
$project = "C:\projects\nft-mint-platform"
mkdir $project; cd $project; git init

# Deploy scaffold
& "C:\Users\davem\Desktop\claude\supercharged-workflows\setup.ps1" -TargetDir .

# Create worktrees for parallel agents
git worktree add ..\nft-contracts -b feature/contracts
git worktree add ..\nft-dashboard -b feature/dashboard
git worktree add ..\nft-widget -b feature/widget
git worktree add ..\nft-api -b feature/api
git worktree add ..\nft-devops -b feature/devops
```

Then start Claude in each worktree with specific tasks:

- **Agent 1** (contracts): Smart contracts + Hardhat
- **Agent 2** (dashboard): Next.js site owner UI
- **Agent 3** (widget): Embeddable mint widget
- **Agent 4** (api): Platform API endpoints
- **Agent 5** (devops): CI/CD, Docker, testing

---

## Vibe Coding from Phone

The teleport workflow:

```
Desktop                    Cloud                     Phone
───────                    ─────                     ─────
1. Start task
2. /teleport ──────────▶  Session transferred
3. Close laptop
                                                     4. Open claude.ai/code
                                                     5. Check progress
                                                     6. Give feedback
                                                     7. "Keep going" or adjust

Back at desk:
8. /teleport back (or continue in cloud)
9. Review & merge
```

Perfect for:
- Long refactors (start, go to lunch, check from phone)
- Overnight autonomous tasks
- Commute monitoring
- "Set it and forget it" workflows

---

## Cost-Conscious Startup

Use the cost-optimized settings:

```powershell
# Copy cost-optimized settings instead of default
copy "$scaffold\scaffold\hooks\settings-cost-optimized.json" ".\.claude\settings.json"
```

This routes:
- Code tasks → Opus (quality)
- Doc tasks → Haiku (cheap)

---

## Troubleshooting

### Agents stepping on each other?
→ Use git worktrees (separate directories)

### Hitting rate limits?
→ Spread agents across time, or upgrade to Max 20x

### Task going off track?
→ Press `Esc Esc` to rewind, give clearer instructions

### Want fully autonomous?
→ Use `/ralph-wiggum` with clear acceptance criteria

---

*See FINDINGS.md for the complete research and best practices.*
