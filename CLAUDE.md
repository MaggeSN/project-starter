# CLAUDE.md — agent instructions for {{PROJECT_NAME}}

This file is loaded automatically into every Claude Code session in this repo.
It documents the **workflow conventions** other agents must follow.

> **Template note:** rename `{{PROJECT_NAME}}` to your project. Adjust the
> "Practical rules" stack-specific lines for your language (Python+Poetry
> by default; swap to your runtime). Delete this note before committing.

## Branching policy

- **Never commit directly to `main`.** All work happens on a `feature/<short-slug>` branch.
- One issue → one branch → one PR → squash-merge into `main`.
- Branch naming: `feature/<github-issue-number>-<slug>` (e.g. `feature/24-search-page`). Bugs: `fix/<slug>`. Pure docs/refactor with no issue: `chore/<slug>`. Sandcastle-spawned: `sandcastle/issue-<id>-<slug>`.
- Open the PR early (draft is fine) so CI starts running. Link the issue with `Closes #N` in the PR body — but only if the PR actually meets all acceptance criteria. If only a slice landed, omit `Closes #N` and file a follow-up issue.
- Push the feature branch with `-u` to track upstream. Never force-push to `main`. Force-push to your own feature branch is fine if rewriting your own history.
- Delete the feature branch after merge.

## Workflow: from idea to merged code

The default sequence for a non-trivial feature is **grill-with-docs → to-prd → to-issues → tdd**. Don't skip steps. Trivial bugfixes can go straight to `tdd`.

| Skill        | When to invoke                                                                                                              | What it produces                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/grill-with-docs` | The user has an idea but the design isn't pinned down. Branch points are unresolved.                                  | A grilled-out plan — every fork resolved one question at a time, challenged against the existing domain model, with terminology sharpened and CONTEXT.md / ADRs updated inline as decisions lock. |
| `/to-prd`    | Design is settled and needs to live somewhere durable.                                                                       | A PRD posted as a GitHub issue, capturing the locked decisions so future agents (or you, in a new session) can pick it up cold.           |
| `/to-issues` | A PRD exists and needs to become work-grabbable units.                                                                       | A set of independently mergeable GitHub issues organised as tracer-bullet vertical slices (each slice ships an end-to-end thin thing).    |
| `/tdd`       | Implementing a single issue.                                                                                                 | Code shipped via red-green-refactor: write failing test first, make it pass, refactor. Commit per green. Each issue → its own feature branch. |

If you find yourself implementing without an issue, **stop and run `/to-issues`** so the work is grabbable by other agents and the PR has something to close. If you find yourself designing without alignment, **stop and run `/grill-with-docs`** so the user gets a chance to redirect before code lands.

## Practical rules

- **Tests live with their target language.** Backend tests under [tests/](tests/). Frontend tests under [frontend/tests/](frontend/tests/) mirroring [frontend/src/](frontend/src/).
- **TDD is the default for both stacks.** Choose a real-DB test runner for the backend (e.g. pytest + testcontainers for Python, vitest + testcontainers-node for TS).
- **Test fixtures come from real data, not hand-built aligned state.** Seed from a captured real payload and let the real code path produce the columns — never hand-set output columns to a convenient value. If a column is populated by a backfill, also test the not-yet-backfilled `NULL` state.
- **Use [tests/factories.py](tests/factories.py) (or equivalent) for any model whose table is NOT truncated between tests.** Seed migrations populate tables that survive `_clean_db`-style fixtures; raw `Model(slug="known-value")` will collide. The factory generates unique `test-<prefix>-<random>` slugs to prevent the bug class.
- **Assert invariants, not just examples.** Where two fields must agree, assert the property and pair them in one return type so divergence is structurally impossible.
- **UI changes need eyes on the rendered result before "done".** Green component tests are not sufficient.
- **One PR per issue.** Don't bundle "while I'm in there" changes into a feature PR — open a separate `chore/` branch.
- **Use `gh` CLI for issues + PRs.** It's installed and authenticated.

## Sandcastle (parallel agent orchestrator)

This project ships with `.sandcastle/` configured for the PR-flow pattern: planner → implementer (per-issue, parallel) → merger (opens one PR per branch, never merges, never closes issues). The human reviews and squash-merges via `gh pr merge <N> --squash` or the web UI.

To run a sandcastle cycle: `npx tsx .sandcastle/main.mts` from the repo root.

Don't let agents close issues directly. Don't let agents `git merge` into trunk. The PR review is the human gate; sandcastle's job ends when PRs are opened.

## Anti-patterns

- "Just pushing to main, it's a small change" — even one-line typo fixes go through a PR.
- Writing code before the issue exists — if the issue is so small the overhead feels silly, then the issue takes 30 seconds to file; do it.
- Skipping `/grill-with-docs` for "obvious" features — the most expensive bugs come from features that seemed obvious until two design branches diverged silently.
- "Verified via ast.parse" — static parse is not test verification. If the sandbox can't run real tests, mark the PR as DRAFT and surface it in the issue.
- Hand-built test fixtures that collide with seed migrations — use `tests/factories.py`.
