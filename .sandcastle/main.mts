// Parallel Planner — three-phase orchestration loop
//
// Phases:
//   Phase 1 (Plan):    Opus agent reads open issues, builds dependency
//                      graph, outputs <plan> JSON with branch names.
//   Phase 2 (Execute): N sonnet agents in parallel via Promise.allSettled,
//                      each working a single issue on its own branch.
//                      Implementer model is sonnet (5x cheaper than opus)
//                      because TDD slice implementation rarely needs
//                      opus-tier reasoning — bump back to opus only if
//                      output quality drops noticeably.
//   Phase 3 (Open PRs): One agent opens a pull request per branch. Does
//                      NOT git-merge anything. Does NOT close issues.
//                      CLAUDE.md convention: one issue → one PR →
//                      squash-merge into main by human.
//
// Outer loop repeats up to MAX_ITERATIONS so newly unblocked issues are
// picked up after each round.

import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 10;

// Lower max iterations cap on implementer (was 100 in default sandcastle).
// Agents that need more than 30 iterations are usually stuck and burning
// tokens; bail earlier and let CI surface what's broken.
const IMPLEMENTER_MAX_ITERATIONS = 30;

const hooks = {
  sandbox: { onSandboxReady: [{ command: "npm install" }] },
  // Add `poetry install --no-interaction --no-root` here if Dockerfile
  // has Python tier installed.
};

const copyToWorktree = ["node_modules"];

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
  console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`);

  // -------------------------------------------------------------------------
  // Phase 1: Plan
  // -------------------------------------------------------------------------
  const plan = await sandcastle.run({
    hooks,
    sandbox: docker(),
    name: "planner",
    maxIterations: 1,
    agent: sandcastle.claudeCode("claude-opus-4-7"),
    promptFile: "./.sandcastle/plan-prompt.md",
  });

  const planMatch = plan.stdout.match(/<plan>([\s\S]*?)<\/plan>/);
  if (!planMatch) {
    throw new Error("Planning agent did not produce a <plan> tag.\n\n" + plan.stdout);
  }

  // The plan JSON contains an array of issues, each with id, title, branch,
  // and an optional model selection from the planner. Sonnet is the
  // default if planner omits — it's 5x cheaper than opus and adequate
  // for scaffolding / TDD-slice work. Planner picks opus only when
  // reasoning depth materially changes the output (architecture, cross-
  // cutting refactors, investigations).
  const { issues } = JSON.parse(planMatch[1]!) as {
    issues: { id: string; title: string; branch: string; model?: string }[];
  };

  if (issues.length === 0) {
    console.log("No unblocked issues to work on. Exiting.");
    break;
  }

  console.log(`Planning complete. ${issues.length} issue(s) to work in parallel:`);
  for (const issue of issues) {
    console.log(`  ${issue.id}: ${issue.title} → ${issue.branch}`);
  }

  // -------------------------------------------------------------------------
  // Phase 2: Execute
  // -------------------------------------------------------------------------
  const settled = await Promise.allSettled(
    issues.map((issue) =>
      sandcastle.run({
        hooks,
        copyToWorktree,
        sandbox: docker(),
        name: "implementer",
        maxIterations: IMPLEMENTER_MAX_ITERATIONS,
        // Model picked by planner per-issue (cost routing); defaults to
        // sonnet if planner omitted.
        agent: sandcastle.claudeCode(issue.model || "claude-sonnet-4-6"),
        promptFile: "./.sandcastle/implement-prompt.md",
        promptArgs: {
          TASK_ID: issue.id,
          ISSUE_TITLE: issue.title,
          BRANCH: issue.branch,
        },
      }),
    ),
  );

  for (const [i, outcome] of settled.entries()) {
    if (outcome.status === "rejected") {
      console.error(`  ✗ ${issues[i]!.id} (${issues[i]!.branch}) failed: ${outcome.reason}`);
    }
  }

  const completedIssues = settled
    .map((outcome, i) => ({ outcome, issue: issues[i]! }))
    .filter(
      (entry) =>
        entry.outcome.status === "fulfilled" &&
        entry.outcome.value.commits.length > 0,
    )
    .map((entry) => entry.issue);

  const completedBranches = completedIssues.map((i) => i.branch);

  console.log(`\nExecution complete. ${completedBranches.length} branch(es) with commits:`);
  for (const branch of completedBranches) {
    console.log(`  ${branch}`);
  }

  if (completedBranches.length === 0) {
    console.log("No commits produced. Nothing to merge.");
    continue;
  }

  // -------------------------------------------------------------------------
  // Phase 3: Open PRs (was Merge in default sandcastle)
  //
  // The agent opens one PR per branch targeting main. Does NOT run
  // git merge. Does NOT close issues — that's the human's call after
  // PR review + squash-merge. Issue closes via "Closes #N" in PR body.
  // -------------------------------------------------------------------------
  await sandcastle.run({
    hooks,
    sandbox: docker(),
    name: "merger",
    maxIterations: 1,
    agent: sandcastle.claudeCode("claude-sonnet-4-6"),
    promptFile: "./.sandcastle/merge-prompt.md",
    promptArgs: {
      BRANCHES: completedBranches.map((b) => `- ${b}`).join("\n"),
      ISSUES: completedIssues.map((i) => `- ${i.id}: ${i.title}`).join("\n"),
    },
  });

  console.log("\nPRs opened for all completed branches.");
}

console.log("\nAll done.");
