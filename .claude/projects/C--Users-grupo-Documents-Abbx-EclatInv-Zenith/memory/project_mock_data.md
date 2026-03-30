---
name: Using mock data for now
description: User wants mock/placeholder data instead of real Supabase calls during Sprint 2 development
type: project
---

Sprint 2 is being built with mock data instead of live Supabase queries. Structure actions and queries so they're easy to swap to real Supabase later.

**Why:** User is focusing on building the UI and flow first before connecting to the real database.

**How to apply:** Use mock data arrays in queries, simulate success responses in actions. Keep the same function signatures and return types so the swap is just changing the implementation body.
