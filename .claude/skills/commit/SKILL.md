---
description: Commit current changes with tracking file updates (CLAUDE.md, STATUS.md). Does not push.
user-invocable: true
---

# Commit Changes

Commit the current changes with a descriptive message and update the project tracking files. Does NOT push to remote.

## Steps

### 1. Review changes

Run `git status` and `git diff --stat` to understand what changed.

### 2. Update CLAUDE.md

Open `CLAUDE.md` and update the **Progreso actual** section at the bottom:
- If a sprint status changed (e.g., sprint completed or started), update it.
- Add or update bullet points under **Completado** to reflect what was built or changed in this session.
- Keep descriptions concise — one line per feature/fix.
- Do NOT remove existing entries unless they are incorrect.

### 3. Update STATUS.md

Open `STATUS.md` and update:
- The **Sprint Progress** table: change status for any sprint that progressed (e.g., "Not started" -> "In progress", "In progress" -> "Complete").
- Add any new key references if relevant (e.g., new external services, new important files).

### 4. Stage all changes

Run `git add -A` to stage everything including the updated tracking files.

### 5. Create commit

Write a clear commit message following this format:
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, etc.
- The subject line should summarize the main change (max 72 chars).
- If multiple things changed, use the most significant one for the subject and list others in the body.
- Write commit messages in English.

Example:
```
feat: Add product catalog CRUD with variant support

- Product list with search, filters, and pagination
- Create/edit product form with image upload
- Variant management (size, color, shade)
- Updated CLAUDE.md and STATUS.md progress tracking
```

### 6. Confirm

Report the commit hash and a summary of what was committed. Remind the user they can run `/push` when ready to push to remote.
