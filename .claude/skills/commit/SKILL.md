---
description: Commit current changes. Lightweight — no tracking file updates. Does not push.
user-invocable: true
---

# Commit Changes

Commit the current changes with a descriptive message. Does NOT update tracking files or push to remote. Use `/push` for important milestones that need tracking.

## Steps

### 1. Review changes

Run `git status` and `git diff --stat` to understand what changed.

### 2. Stage changes

Run `git add -A` to stage everything.

### 3. Create commit

Write a clear commit message following this format:
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, etc.
- The subject line should summarize the main change (max 72 chars).
- If multiple things changed, use the most significant one for the subject and list others in the body.
- Write commit messages in English.

**IMPORTANT**: To avoid Windows command-line length limits, always write the commit message to a temp file and use `git commit -F`:
```bash
# Write message to temp file, commit, then clean up
echo "feat: Subject line here" > .git/COMMIT_MSG_TMP
echo "" >> .git/COMMIT_MSG_TMP
echo "- Detail 1" >> .git/COMMIT_MSG_TMP
echo "- Detail 2" >> .git/COMMIT_MSG_TMP
git commit -F .git/COMMIT_MSG_TMP
rm .git/COMMIT_MSG_TMP
```

Do NOT use `git commit -m "..."` — the message can exceed Windows' 8191-char command limit.

### 4. Confirm

Report the commit hash and a summary of what was committed. Remind the user they can run `/push` when ready to push to remote.
