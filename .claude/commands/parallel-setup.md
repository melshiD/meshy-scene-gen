# Parallel Agents Setup

Set up Git worktrees for running multiple Claude agents in parallel.

## What This Does

Creates isolated workspaces so multiple Claude agents can work on different tasks simultaneously without file conflicts.

## The Problem

If two Claude agents edit the same file at the same time:
- Changes get overwritten
- Merge conflicts occur
- Work is lost

## The Solution: Git Worktrees

Each agent gets its own complete copy of the codebase:

```
project/              # Main repo
project-agent1/       # Worktree 1 (feature branch)
project-agent2/       # Worktree 2 (bugfix branch)
project-agent3/       # Worktree 3 (tests branch)
```

## Setup Commands

### Create Worktrees

```bash
# From your main project directory
cd /path/to/project

# Create worktrees for parallel agents
git worktree add ../project-agent1 -b feature/task1
git worktree add ../project-agent2 -b feature/task2
git worktree add ../project-agent3 -b feature/task3
git worktree add ../project-agent4 -b feature/task4
git worktree add ../project-agent5 -b feature/task5
```

### List Worktrees

```bash
git worktree list
```

### Remove Worktrees (when done)

```bash
git worktree remove ../project-agent1
git worktree remove ../project-agent2
# etc.
```

## Terminal Setup

### Option 1: Tabbed Terminal (Recommended)

Open 5 terminal tabs:
- Tab 1: `cd project-agent1 && claude`
- Tab 2: `cd project-agent2 && claude`
- Tab 3: `cd project-agent3 && claude`
- Tab 4: `cd project-agent4 && claude`
- Tab 5: `cd project-agent5 && claude`

### Option 2: tmux

```bash
# Create tmux session with 5 panes
tmux new-session -s claude-agents \; \
  split-window -h \; \
  split-window -v \; \
  select-pane -t 0 \; \
  split-window -v \; \
  select-pane -t 2 \; \
  split-window -v
```

### Option 3: Windows Terminal

Create profiles in settings.json for each worktree.

## Workflow

### 1. Plan Tasks

Decide what each agent will work on:
- Agent 1: New feature A
- Agent 2: Bug fix B
- Agent 3: Test coverage
- Agent 4: Documentation
- Agent 5: Refactoring

### 2. Start Agents

In each terminal/worktree:
```
/plan "[specific task for this agent]"
```

### 3. Monitor Progress

- Enable terminal notifications (iTerm2, Windows Terminal)
- Check which agents need input
- Respond to each as needed

### 4. Merge Results

When agents complete:
```bash
# In main repo
git checkout main
git merge feature/task1
git merge feature/task2
# Resolve any conflicts
git push
```

## Notifications Setup

### iTerm2 (Mac)

1. Preferences → Profiles → Terminal
2. Enable "Notification center alerts"
3. Set "Notification triggers" for Claude prompts

### Windows Terminal

1. Settings → Profiles → Advanced
2. Enable "Bell notification style: Window attention"

## Tips

1. **Assign clear, independent tasks** - Avoid agents working on the same files

2. **Use feature branches** - Each worktree should be a separate branch

3. **Shared CLAUDE.md** - All worktrees share the main repo's CLAUDE.md

4. **Regular merges** - Merge completed work frequently to avoid drift

5. **Cloud + Local** - Combine 5 local agents with 5-10 teleported cloud sessions

## Arguments

$ARGUMENTS can specify:
- Number of worktrees to create
- Branch naming pattern
- Task assignments

## Example Usage

```
/parallel-setup 5
/parallel-setup 3 "feature/sprint-42"
```

## Quick Setup Script

Run this to set up 5 parallel agents:

```bash
#!/bin/bash
PROJECT=$(basename $(pwd))
for i in {1..5}; do
  git worktree add ../${PROJECT}-agent${i} -b feature/agent${i}-task
done
echo "Created 5 worktrees. Start Claude in each:"
for i in {1..5}; do
  echo "  cd ../${PROJECT}-agent${i} && claude"
done
```
