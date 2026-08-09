# CLAUDE.md
Guidance Claude Code loads at the start of every session in this repo.

<!-- BEGIN STANDARD -->
## Response style
- Lead with the concrete next action, before context or caveats.
- Number multi-step work.
- Restate what's done and what's left each turn.
- No tangents or "you might also consider."
- Time estimates as specifics ("~5 min").
- Call out completed steps explicitly.
- Never use em dashes. Not in chat, not in code, comments, UI copy,
  commit messages, or anything committed. Use commas, colons,
  parentheses, or a full stop instead.

## Design and UI work
Any product or feature change with a visual surface: present exactly three
options (A, B, C), one-line rationale each. Render them, never describe
them in prose. Build each as a working preview and open all three side by
side in a browser. `/design-shotgun` does this end to end.
Stop and wait for a choice before building anything further.

## Git workflow
- Never commit to `main`. Branch as `claude/<description>`.
- One PR per logical change, no mixing chores into feature branches.
- Delete the branch after merge.
<!-- END STANDARD -->
# zebra-data

## Merge policy

This repo runs a supervised PR factory. `factory-review` passes (green) when the reviewer
runs and returns a verdict; auto-merge eligibility is limited to `APPROVE-LOWRISK`. Auto-merge
is **disabled** until the repo variable `FACTORY_AUTOMERGE` is set to `true` (after a
supervised soak). This product handles **PHI / PII (HIPAA, SSNs, intake data)** — the escalate
list is deliberately broad and absolute.

**Low-risk surfaces — eligible for auto-merge** (presentation / copy / pure display only):

- `lib/utils.ts` — pure display helpers (`cn`, `formatDate`, `maskSsn`), covered by `lib/utils.test.ts`
- `components/ZebraLogo.tsx` — presentational, covered by `components/ZebraLogo.test.tsx`
- `components/landing/**` — marketing components
- Marketing / legal content pages: `app/page.tsx`, `app/why-zebra/**`, `app/platform/**`,
  `app/scheduling/**`, `app/care-management/**`, `app/careers/**`, and the legal pages
  `app/privacy/**`, `app/terms/**`, `app/hipaa/**`, `app/security/**`, `app/soc2/**`

**Always escalate to a human — never auto-merge, regardless of how small the change:**

- Anything touching PHI/PII, intake data, SSNs, or the patient/care data model
- Auth, sessions, Supabase, or access control (`lib/supabase/**`, `middleware.ts`,
  `components/UserMenu.tsx`)
- The database, schema, or migrations (`lib/db/**`, `drizzle.config.ts`, `supabase/**`)
- Crypto / secrets (`lib/crypto.ts`), validation, connectors, resolver, sync, logging
  (`lib/validation/**`, `lib/connectors/**`, `lib/resolver/**`, `lib/sync/**`, `lib/logger.ts`)
- The authed app and its UI (`app/(app)/**`, `app/intake/**`, `components/connections/**`,
  `components/dashboard/**`)
- Any API route, CI/workflow, build config, or dependency change
- **Anything not explicitly listed as low-risk above**

When in doubt, escalate — this handles health data. The reviewer
(`.claude/agents/pr-reviewer.md`) enforces this policy; tighten it whenever something slips.

## Tests

`npm test` runs the Vitest suite (the factory's safety net) over the low-risk surfaces above.
Adding a surface to the low-risk list means adding real tests for it first.
