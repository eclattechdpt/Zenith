# Diagnose — Analyze Issues Before Fixing

When the user invokes `/diagnose`, enter investigation mode. Do NOT make any code changes or fixes. The goal is to understand what went wrong, explain it simply to the user, and align before taking any action.

## Context

This is for **Zenith POS** — most code changes are made by Claude, not the user. Issues often stem from Claude misunderstanding a request, a side effect of a previous change, or a gap between what was intended and what was implemented. Always consider this when investigating.

## Steps

### 1. Investigate

Read the related code files first — always. Look at:
- The file(s) mentioned in the error or related to the issue
- Recent changes made in this session that could have caused the problem
- Related files that might be affected (imports, parent components, layouts)

Do NOT skip this step. Understanding the current code state is critical.

### 2. Identify the root cause

Trace the chain of events:
- What change or combination of changes led to this issue?
- Was it a misunderstanding of the user's request?
- Was it a side effect of a change that looked correct but broke something else?
- Is it a stale cache, missing import, or environment issue?

If something seems like it could have been caused by the user's own changes or a miscommunication, ask brief clarifying questions about what they were trying to achieve.

### 3. Explain simply

Tell the user what happened in **2-3 simple sentences**. No jargon walls. Structure it as:
- **What's happening**: The visible symptom (error message, wrong behavior, broken UI)
- **Why it happened**: The root cause in plain language
- **What we need to do**: A one-line summary of the fix direction

### 4. Wait for alignment

After explaining, ask the user if they want to proceed with the fix. Do NOT start fixing until they confirm. This ensures both sides understand the problem and agree on the solution direction.

## Rules

- NEVER make code changes, edits, or fixes during `/diagnose`
- ALWAYS read the related code before explaining — never guess from memory
- Keep explanations short and simple — if it takes more than 3-4 sentences, you're overexplaining
- If the issue was caused by Claude's own mistake, own it directly — don't be vague
- If you need to ask the user a question, limit it to 1-2 targeted questions, not a list
- Screenshots and error messages from the user are your primary clues — reference them specifically
