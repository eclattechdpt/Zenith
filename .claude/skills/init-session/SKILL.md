---
description: Read project tracking files and summarize current project state.
user-invocable: true
---

# Initialize Session

Read the project tracking files to get full context of the current state of the project.

## Steps

### 1. Read project tracking files

Read the following files:
- `CLAUDE.md` — Project instructions, conventions, and current progress
- `STATUS.md` — Sprint progress table and key references

### 2. Check git status

Run `git status` and `git log --oneline -5` to understand:
- What branch we're on
- Any uncommitted changes
- The last 5 commits for recent context

### 3. Summarize

Give the user a brief summary:
- Current sprint and its status
- What was last worked on (from recent commits)
- Any uncommitted changes that need attention
- What's next based on sprint progress

Keep the summary short — 5-8 lines max.
