# ISSUES

Here are the open issues in the repo:

<issues-json>

!`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`

</issues-json>

The list above has already been filtered to issues ready for work.

# TASK

Analyze the open issues and build a dependency graph. For each issue, determine whether it **blocks** or **is blocked by** any other open issue.

An issue B is **blocked by** issue A if:

- B requires code or infrastructure that A introduces
- B and A modify overlapping files or modules, making concurrent work likely to produce merge conflicts
- B's requirements depend on a decision or API shape that A will establish

An issue is **unblocked** if it has zero blocking dependencies on other open issues.

For each unblocked issue, assign a branch name using the format `sandcastle/issue-{id}-{slug}`.

# MODEL SELECTION (cost routing)

For each unblocked issue, pick which model the implementer should use:

- **`claude-sonnet-4-6`** — default. 5× cheaper than opus. Use for:
  - Scaffolding: "add X column", "expose Y endpoint", "wire Z dependency"
  - Local edits: "rename A to B", "extract helper", "add test for"
  - TDD slices with narrow scope (e.g. "slice 3/10" of a parent issue)
  - Issues with `chore`, `docs`, or `refactor` labels
  - Issues with explicit `## Out of scope` sections keeping the work small

- **`claude-opus-4-7`** — use only when reasoning depth materially affects output:
  - Architectural decisions, ADR-track work
  - Cross-cutting refactors touching 3+ modules
  - Investigations: "figure out why X happens"
  - Ambiguous requirements where the agent has to make design calls
  - Issue body > 3000 chars (dense context → more reasoning surface)
  - Issues labelled `complex`, `architecture`, or `spike`

When in doubt: pick sonnet. Opus is only worth 5× cost when reasoning depth genuinely changes the result.

# OUTPUT

Output your plan as a JSON object wrapped in `<plan>` tags:

<plan>
{"issues": [
  {"id": "42", "title": "Fix auth bug", "branch": "sandcastle/issue-42-fix-auth-bug", "model": "claude-sonnet-4-6"},
  {"id": "55", "title": "Refactor billing to event-sourced", "branch": "sandcastle/issue-55-billing-event-source", "model": "claude-opus-4-7"}
]}
</plan>

Include only unblocked issues. If every issue is blocked, include the single highest-priority candidate (the one with the fewest or weakest dependencies). Always include the `model` field — omitting it falls back to sonnet but explicit is clearer.
