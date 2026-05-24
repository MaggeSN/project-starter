# TASK

For each of the branches below, open a pull request targeting `main`.

{{BRANCHES}}

Do NOT merge the branches yourself. Do NOT close the issues. Humans review and merge the PRs; the PR's `Closes #N` line auto-closes the issue on merge. This honours the project convention in CLAUDE.md:

> One issue → one branch → one PR → squash-merge into main.

# PER-BRANCH STEPS

For each branch:

1. **Check out the branch.** `git checkout <branch>`
2. **Run feedback loops.** `npm run typecheck`, `npm test -- --run` (frontend), and `poetry run pytest tests/` (backend) if those tools are available in the sandbox. The branch should be green BEFORE a human is asked to review. If they fail, fix on the branch and commit before opening the PR. If a tool is missing from the sandbox (e.g. no Python/Postgres for pytest), open the PR as DRAFT and leave a comment on the issue explaining what couldn't be verified locally — CI on the PR will catch it.
3. **Push the branch.** `git push -u origin <branch>`
4. **Open the PR.** Use a HEREDOC for the body so newlines survive:

   ```bash
   gh pr create --base main --head <branch> \
     --title "<concise title, ≤70 chars>" \
     --body "$(cat <<'EOF'
   Closes #<ID>

   <2-3 sentence summary of what changed and why>

   <If only a TDD slice landed: list slices delivered + slices deferred.
    Be honest — do not claim acceptance is met when only the tracer slice
    shipped. File a follow-up tracking issue for deferred work and link
    it from the PR body. If acceptance is NOT met, omit the "Closes #N"
    line so merging the PR does not auto-close the still-incomplete issue.>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   EOF
   )"
   ```

   If tests failed or were unverifiable in step 2, add `--draft` to the `gh pr create` call.

# CONTEXT

Issues this run completed work on:

{{ISSUES}}

Use each issue's title + body to write a meaningful PR title and body. The title is short; the body carries the detail.

# RULES

- Do NOT run `git merge`. Do NOT push to `main`. Do NOT close issues.
- One PR per branch — never bundle multiple branches into a single PR.
- If a branch has dependencies on another branch that isn't merged yet (check the issue body for `## Depends on` or `Relationship to #N` sections), open the PR as DRAFT and note the dependency in the PR body. The human will un-draft once the parent merges.
- After opening every PR, switch back to `main` so the worktree is in a clean baseline state: `git checkout main`.

Once you've opened a PR for every branch, output <promise>COMPLETE</promise>.
