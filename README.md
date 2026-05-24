# project-starter

GitHub template for parallel-agent (sandcastle) projects with CI gates and PR-flow.

## What you get

- `.sandcastle/` — patched orchestrator (PR-flow, not git-merge-and-close)
- `.github/workflows/ci.yml` — backend + frontend test gates that block bad PRs
- `.gitignore` — ironclad: catches root `node_modules/`, `.venv/`, `.sandcastle/`
- `CLAUDE.md` — workflow conventions sandcastle agents must follow
- `tests/factories.py` — skeleton for collision-safe test fixtures

## First-run setup

1. **Use this template** via GitHub's "Use this template" button → new repo
2. Clone the new repo locally
3. Rename `{{PROJECT_NAME}}` throughout `CLAUDE.md`
4. Add your stack-specific dependencies (`pyproject.toml`, `package.json`, etc.)
5. Wire your seed migration(s); update `tests/factories.py` per-model
6. `cp .sandcastle/.env.example .sandcastle/.env-sandcastle` and fill in API keys
7. `gh repo edit --enable-issues` (sandcastle reads `gh issue list`)

## Sandcastle cycle

```bash
# 1. File issues via /to-prd + /to-issues skills (or by hand)
# 2. Invoke sandcastle on a clean integration branch:
git checkout -b integ/cycle-1 main
npx tsx .sandcastle/main.mts

# 3. Sandcastle runs:
#    - Planner reads open issues, builds dep graph, picks unblocked ones
#    - N implementers run in parallel (one branch per issue)
#    - Merger opens one PR per branch, targeting main
#    - Sandcastle exits — does NOT merge, does NOT close issues

# 4. You review the opened PRs:
gh pr list --label sandcastle: --json number,title,statusCheckRollup

# 5. For each green PR, merge manually:
gh pr checks <N> && gh pr merge <N> --squash
# (Issue auto-closes via "Closes #N" in PR body — only present if
# acceptance criteria were met. Partial slices have no Closes line.)
```

## Cost knobs

In `.sandcastle/main.mts`:

- `IMPLEMENTER_MAX_ITERATIONS = 30` — agents stuck past this are usually burning tokens. Lower if cost matters more than completeness.
- Implementer model defaults to `claude-sonnet-4-6` (5× cheaper than opus). Swap to opus-4-7 if implementation quality drops noticeably.
- Planner stays on opus — dependency analysis benefits from deeper reasoning.

## Branch protection

Private repos on GitHub Free can't enforce branch protection rules. Either:

- Pay for GitHub Pro ($4/mo) — get full branch protection on `main`
- Or make the repo public (everything in this template is safe to publicize)
- Or use `gh pr merge --auto --squash` convention — merge queues until CI green
- Or just check `gh pr checks <N>` before clicking merge — discipline

## Template drift

When you fix a structural bug in any project using this template, also commit the fix here. Templates rot fast. Manual sync ritual > automation that bitrots.
