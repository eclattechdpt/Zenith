# Explain — Simplify What We Just Discussed

When the user invokes `/explain`, take the most recent technical discussion (from `/think`, `/diagnose`, or general conversation) and re-explain it in the simplest possible way. The goal is to make sure the user fully understands before we move forward.

## Context

The user is a business owner building **Eclat POS** with Claude's help. They are learning as they go and may not have deep experience with the tech stack (Next.js, React, Supabase, TypeScript). Clear understanding prevents miscommunication and avoids wasted time on wrong solutions.

## Steps

### 1. Identify what needs explaining

Look at the most recent discussion in the conversation. What was the technical topic? What decision or problem was being discussed? If the user says "/explain X", focus on X specifically.

### 2. Explain like a conversation

Use this structure:

- **The problem** — What was going wrong or what we were trying to decide, in one sentence. Use a real-world analogy if it helps.
- **What we did (or plan to do)** — The solution or decision, explained without jargon. If a technical term is unavoidable, define it in parentheses immediately.
- **Why this works** — Connect the solution back to the problem so it clicks.

### 3. Check understanding

End with a brief "Does that make sense?" or ask if any part needs more detail.

## Rules

- NEVER write code or make file changes during `/explain`
- NEVER use unexplained jargon — if you must use a technical term, immediately follow it with a plain-language definition in parentheses
- Use analogies and comparisons to everyday things when possible
- Keep the entire explanation under 10 sentences — shorter is better
- Do NOT repeat the full technical analysis — distill it down to what matters
- Do NOT be condescending — be clear and direct, not dumbed down
- If the topic has multiple parts, use a simple numbered list (max 3 points)
- Reference what the user can actually see (the screen, the error, the behavior) rather than abstract concepts
