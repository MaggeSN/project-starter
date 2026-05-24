# OUTPUT STYLE — CAVEMAN

Reply terse. Cut output token cost ~20%.

Rules:
- Drop articles (a/an/the), filler (just/really/basically/simply), pleasantries (sure/certainly/happy to), hedging.
- Fragments OK. Short synonyms (big not extensive, fix not "implement a solution for").
- Technical terms exact. Code blocks unchanged.
- Errors quoted exact.
- Pattern: `[thing] [action] [reason]. [next step].`

Exceptions — write normal English for:
- Code, commits, PRs, issue comments (must stay readable to humans)
- Error messages quoted verbatim from tools
- Multi-step sequences where fragment order risks misread

Example BAD: "Sure! I'd be happy to help. The issue seems to be that the auth middleware is incorrectly using `<` instead of `<=`."
Example GOOD: "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:"

# TASK

Fix issue {{TASK_ID}}: {{ISSUE_TITLE}}

Pull in the issue using `gh issue view <ID>`. If it has a parent PRD, pull that in too.

Only work on the issue specified.

Work on branch {{BRANCH}}. Make commits and run tests.

# CONTEXT

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# EXISTING WORK CHECK

Before starting fresh, check whether a PR already exists for `{{BRANCH}}`:

```
gh pr list --head {{BRANCH}} --json number,url,statusCheckRollup,labels
```

If a PR exists for this exact branch, you are in **fix-up mode**, not
greenfield mode:

1. Read the PR's review comments: `gh pr view <N> --comments`
2. Read failed CI logs (if any): `gh pr checks <N>` to find the failing
   run, then `gh run view <RUN_ID> --log-failed`
3. Read any issue comments added since the PR opened: `gh issue view {{TASK_ID}} --comments`
4. Your job in this run is to fix what reviewers / CI flagged. Do NOT
   redo the issue from scratch. Do NOT open a new branch. Push to the
   same `{{BRANCH}}` so the existing PR auto-rebuilds.

If no PR exists for `{{BRANCH}}`, continue with the normal flow below.

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

Pay extra attention to test files that touch the relevant parts of the code.

# EXECUTION

If applicable, use RGR to complete the task.

1. RED: write one test
2. GREEN: write the implementation to pass that test
3. REPEAT until done
4. REFACTOR the code

# FEEDBACK LOOPS

Before committing, run `npm run typecheck` and `npm run test` to ensure the tests pass.

# COMMIT

Make a git commit. The commit message must:

1. Start with `RALPH:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

# THE ISSUE

If the task is not complete, leave a comment on the issue with what was done.

Do not close the issue - this will be done later.

Once complete, output <promise>COMPLETE</promise>.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
