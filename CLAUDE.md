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
