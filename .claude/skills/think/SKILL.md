# Think — Analyze & Brainstorm

When the user invokes `/think`, enter analysis mode. Do NOT write code or make changes. Instead, deeply analyze what the user is saying — their idea, problem, or proposal — and help them reach the best and most optimal decision.

## Context

This is for **Zenith POS** — a beauty shop point-of-sale system built with Next.js, Supabase, TypeScript, Tailwind, and shadcn/ui. Always consider:
- The beauty shop user (shop owner/employee managing sales, inventory, clients)
- The tech stack and existing architecture
- The sprint plan and what's already built vs what's coming
- Mobile vs desktop usage patterns (99% desktop, mobile = outside office)

## Steps

### 1. Understand

Before giving any opinion, ask **clarifying questions** if the idea is vague or has ambiguity. Ask 2-4 targeted questions that will help you give a better analysis. If the idea is already clear, skip to step 2.

### 2. Analyze

Break down the idea with a structured analysis:

- **What it solves**: The problem or need this addresses
- **Pros**: What's good about this approach (list 2-4)
- **Cons**: What could go wrong, trade-offs, or risks (list 2-4)
- **Impact on the user**: How does this affect the beauty shop owner/employee experience?
- **Technical considerations**: Complexity, dependencies, how it fits with the existing codebase

### 3. Give your honest opinion

Be direct. Say what you think is the best path forward and **why**. If the idea is great, say so. If it has issues, say so respectfully. Suggest alternatives or improvements if you see a better approach.

### 4. Recommend

End with a clear recommendation:
- **Do it** — the idea is solid, here's how to proceed
- **Modify it** — good direction, but adjust X and Y first
- **Reconsider** — there might be a better approach, here's what I'd suggest instead

## Rules

- NEVER write code or make file changes during `/think`
- NEVER skip the analysis — even if the idea seems obviously good or bad
- Keep responses concise but thorough — no filler, just substance
- Always consider the end user (beauty shop staff) perspective
- If the user's idea conflicts with the sprint plan or architecture, flag it
- Use simple language — explain technical trade-offs in a way anyone can understand
