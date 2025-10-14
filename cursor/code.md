# Step 1

TASK
Analyze this repository and output a single Markdown document named **repo_profile_md**. Be evidence-first: every non-obvious claim must include evidence paths (optionally with line ranges like "path:12-44"). Output ONLY the document below—no extra commentary, no code fences.

ONE GLOB SEARCH (MANDATORY)
Perform exactly one repo-wide glob to harvest prior AI conventions:
**/{.github/copilot-instructions.md,AGENT.md,AGENTS.md,CLAUDE.md,.cursorrules,.windsurfrules,.clinerules,.cursor/rules/**,.windsurf/rules/**,.clinerules/**,README.md}

DISCOVERY (LANGUAGE/TOOL AGNOSTIC)
- Identify “stacks” by inspecting manifests, build files, configs, and CI. Do NOT assume languages/tools; infer them.
- Extract architecture (components, boundaries, data flows, rationales).
- For each discovered stack: package/build/test/lint/format/typecheck/coverage/debug tools and the exact runnable commands (from manifests, scripts, presets, CI, docs).
- Developer workflows, non-obvious commands (Make/Task/Just/scripts), IDE/debug configs.
- Integrations (external services, ports, auth, env vars), schemas/specs, and how to run deps locally.
- Algorithms/performance hotspots, invariants, concurrency rules, observability hooks.

STRUCTURE (use these exact headings and field formats)

# chosen_ai_conventions
- sources:
  - <relative path>
- merged_summary:
  - <2–8 bullets>
- conflicts:
  - topic: <short>
    options: [A, B]
    decision: <chosen>
    rationale: <why>

# architecture
## components
- name: <name> | path: <dir> | responsibility: <one line> | depends_on: [..] | interfaces: [http|grpc|cli|queue|db]
## data_flows
- from: <comp> | to: <comp> | via: <proto> | schema_or_contract: <path or brief> | evidence: [<path[:L-L]>]
## rationales
- decision: <short> | evidence: [<path[:L-L]>] | notes: <optional>

# stacks
## stack:<id>
- language: <detected>            # if known from evidence
- roots: [<dirs/files>]
- manifests: [<build/packaging files>]
- package_managers: [<names>]
- build_systems: [<names>]
- test_runners: [<names>]
- lint_tools: [<names>]
- format_tools: [<names>]
- typecheck_tools: [<names>]
- coverage_tools: [<names>]
- debug_tools: [<names/flags>]
- run_commands: ["<exact commands>"]
- evidence: [<paths[:L-L]>]

# workflows
## dev_loop
### stack:<id>
- setup: ["..."]
- configure: ["..."]
- build: ["..."]
- run: ["..."]
- test: ["..."]
- lint: ["..."]
- format: ["..."]
- typecheck: ["..."]
- coverage: ["..."]
- debug: ["..."]
- notes: <optional>
## ci_parity
- how_to_mirror: ["..."]
- evidence: ["./.github/workflows/..."]

# integrations
- services:
  - name: <svc> | protocol: <http/grpc/...> | port: <int?> | auth: <brief> | env_vars: [NAMES_ONLY] | evidence: [<paths>]
- storage:
  - type: <db/cache/fs> | name: <id> | migrations: <how> | evidence: [<paths>]
- schemas:
  - kind: openapi|proto|graphql|sql | paths: [<paths>] | generation_commands: ["..."] | evidence: [<paths>]

# algorithms
## hotspots
- module: <name> | path: <file/dir> | invariants: [..] | complexity: <brief> | perf_notes: <one-liner> | evidence: [<paths>]
## debugging
- common_failures: ["..."]
- observability:
  - logs: ["..."]
  - metrics: ["..."]
  - traces: ["..."]

# proposed_cursor_rule_files
- architecture.mdc
- workflows.mdc
- testing.mdc
- integrations.mdc
- algorithms.mdc
- guardrails.mdc
- style-<stack id>.mdc   # one per stack

# unknowns
- question: <crisp> | why_it_matters: <brief> | best_guess_if_any: <optional> | evidence: [<paths>]

# evidence_index
- <list every path you cited>

CONSTRAINTS
- Use only relative paths; include line ranges where helpful.
- Prefer what CI/README/presets/scripts show. Do not invent commands.
- Keep the document concise (aim for <300 lines). No extra sections.

# Step 2

TASK
Consume repo_profile_md and generate FULL contents for:
- .github/copilot-instructions.md
- AGENTS.md
- GEMINI.md
- .cursor/rules/*.mdc   (use every filename under # proposed_cursor_rule_files; include one style file per stack, named "style-<stack id>.mdc")

GENERAL RULES
- Evidence-first: after any non-obvious rule or command, add a bullet **“Where this is proven:”** with exact paths from # evidence_index (line ranges optional).
- Do NOT assume languages/tools; derive everything from # stacks and # workflows.
- Prefer presets/scripts/targets shown in evidence (CI, manifests, preset files). If both a preset and a generic command exist, show the preset first and the generic as a fallback.
- Redact secrets. Keep env var NAMES; use placeholders for values (EXAMPLE_TOKEN="****").
- Keep sections concise (≤ ~120 lines per top-level section). Use bullets and short code blocks.

UPDATE MODE
- For each target file:
  - If the file exists, prefer a minimal edit.
  - If the file contains generated fences (see fence format below), replace only the fenced sections with the new content for those sections.
  - If no fences are present, DO NOT delete unique manual prose. Produce:
    1) A unified diff that changes only what is necessary.
    2) An optional "Generated Appendix" at the end for new sections that don't map cleanly onto existing headings.
- Preserve file-specific items (front-matter, badges, custom anchors).
- Keep the original heading order when possible; add missing sections after the closest related heading.
- Be idempotent: re-running Step 2 should produce an empty diff when nothing has changed.

OUTPUT MODE
- If a file is new → output its full content.
- If a file exists → output a unified diff (preferred). Only fall back to full-file replacement when the file is mostly generated or the diff would be larger/less clear than a full rewrite.

FILE CONTENT REQUIREMENTS

1) .github/copilot-instructions.md
Order:
- Purpose & Scope (what the assistant should/shouldn’t do here)
- Quick Start (repeat for EACH stack discovered)
  - Setup / Build / Run / Test / Lint / Format / Typecheck / Coverage / Debug
  - Use exact commands from # workflows → dev_loop for that stack
  - Add “Where this is proven:” bullets referencing repo files/CI
- Code Style & Conventions (per stack if they differ)
  - Mention style/lint/type tools with config paths
- Testing Rules (layout, markers/labels, coverage rules)
- Error Handling & Logging (patterns; correlation/trace IDs if present)
- Performance & Complexity (hotspots, invariants, concurrency)
- Safe Change Boundaries (public APIs, wire formats, migrations)
- Integration Points (services, ports, env vars, local deps; how to start them)
- PR Expectations (checks to run; commit style/branch rules if present)
- AI FAQ (5–10 Q→A grounded in common tasks, with evidence)
- Unknowns/TODOs (from # unknowns)

2) AGENTS.md
- Read Me First (8–12 bullets summarizing the repo, each with evidence)
- Allowed vs Disallowed AI changes (explicit; protect public contracts)
- Common Tasks (for EACH stack)
  - dev env spin-up; run tests/coverage; run/debug; add module/endpoint; update schema/migration; regenerate code/specs if applicable
  - exact commands with evidence
- Debugging Playbook (flags, verbose modes, filters, profiles)
- Integration Map (services/protocols/ports/auth/health/seed data)
- Patterns & Anti-patterns (with path examples)
- Safety & Secrets (env var catalog with safe placeholders)
- Escalation & TODOs (from # unknowns)

3) GEMINI.md
- How to frame multi-file edits (context packing: which files/dirs to show first for the relevant stack)
- Diff-friendly directions (ask for unified diffs or full-file replacements, as appropriate)
- Validation steps (run tests/lints/typechecks; reference configs)
- Short prompt library (6–10 copyable prompts tailored to the discovered tooling)
- Final checklist: tests green, lints clean, typechecks pass, no secrets in diffs

4) .cursor/rules/*.mdc
Create:
- architecture.mdc — overview, data flows, “Don’t Break” invariants
- workflows.mdc — dev loops per stack; debug flags; CI parity
- testing.mdc — how to write tests; fast vs slow; coverage commands
- integrations.mdc — external deps, ports, env var catalog (placeholders)
- algorithms.mdc — invariants, accepted complexities, perf knobs, failure modes, instrumentation
- guardrails.mdc — allowed/disallowed refactors; public APIs/contracts; secrets handling
- style-<stack id>.mdc — one per stack; style, naming, error/log patterns, test patterns
FORMAT for each rule file:
- Use concise bullets. Begin each rule with **Rule:**.
- After non-obvious rules, add **Evidence:** <paths>.
- Keep each file ≤ ~120 lines.

DELIVERABLES — OUTPUT FORMAT
Return only the files and a short Change Log.
Each file starts with a header line and then its full contents, e.g.:
- For updates, include a "## Edits" section with diffs per file. If a file is entirely new, include a "## New Files" section with full contents.


# .github/copilot-instructions.md
<full content>

# AGENTS.md
<full content>

# GEMINI.md
<full content>

# .cursor/rules/architecture.mdc
<full content>

# ... (include all rule files)

# Change Log
- <bullets of what was merged/standardized vs any prior AI docs>

# Step 3

TASK
Review the generated files against repo_profile_md. Output:
1) A short **Verification Report** (bullets).
2) **Edits** as unified diffs OR full-file replacements (choose the smallest clear form).

CHECKLIST
- Every non-obvious command has a nearby “Where this is proven:” bullet using paths from # evidence_index.
- Guidance matches the stacks/workflows discovered (no assumed tools).
- Lint/format/typecheck tools and config paths exist in the repo.
- Public APIs/wire formats/migration rules are protected under guardrails.
- Integrations include ports/auth/env vars, with only placeholder values.
- Unknowns/TODOs appear at the end of each file (deduplicated).
- No secrets in examples.
- Each `.cursor/rules/*.mdc` file ≤ ~120 lines.

OUTPUT FORMAT
Verification Report
- <bullets>

Edits
- Provide unified diffs for all updated existing files (no full replacements unless strictly necessary).
- Provide full contents only for brand-new files or when a full rewrite is safer/clearer than a long diff.

EXTRA CHECKS (updates)
- Fenced regions were replaced exactly; non-fenced manual content was preserved verbatim.
- Headings and anchors that existed before still resolve (no broken links).
- Re-running Step 2 on the updated files yields no further changes (idempotent).

