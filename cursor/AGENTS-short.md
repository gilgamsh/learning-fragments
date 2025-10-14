Got it. Here are **much shorter, copy‑ready prompts** for the 3‑step flow—**stack‑agnostic**, **diff‑first updates**, **no fences**, and using a compact **Markdown profile**.

---

## 1) ANALYZER → produce `repo_profile.md` (concise)

```text
TASK
Analyze the repo and write ONE Markdown doc named repo_profile.md. Evidence-first: cite relative paths (optionally with :L-L). Write only the doc—no extra prose.

ONE GLOB SEARCH (MANDATORY)
**/{.github/copilot-instructions.md,AGENT.md,AGENTS.md,CLAUDE.md,.cursorrules,.windsurfrules,.clinerules,.cursor/rules/**,.windsurf/rules/**,.clinerules/**,README.md}

DISCOVER (do not assume tools—infer from files/CI)
- Architecture, components, data flows, rationales.
- Stacks: per stack list manifests/tools for build/test/lint/format/typecheck/coverage/debug + exact runnable commands.
- Workflows: dev loop cmds; non-obvious scripts/targets; CI parity; IDE/debug configs.
- Integrations: services/ports/auth/env vars; schemas; local deps.
- Algorithms: hotspots, invariants, perf notes; observability.

STRUCTURE (use exactly these headings/fields)
# chosen_ai_conventions
- sources: (paths)
- merged_summary: (bullets)
- conflicts: topic | options [A,B] | decision | rationale

# architecture
## components
- name | path | responsibility | depends_on[...] | interfaces[...]
## data_flows
- from | to | via | schema_or_contract | evidence[...]
## rationales
- decision | evidence[...] | notes

# stacks
## stack:<id>
- language? | roots[...] | manifests[...] | package_managers[...] | build_systems[...] | test_runners[...] | lint_tools[...] | format_tools[...] | typecheck_tools[...] | coverage_tools[...] | debug_tools[...] | run_commands["..."] | evidence[...]

# workflows
## dev_loop
### stack:<id>
- setup[] | configure[] | build[] | run[] | test[] | lint[] | format[] | typecheck[] | coverage[] | debug[] | notes
## ci_parity
- how_to_mirror[] | evidence[".github/workflows/..."]

# integrations
- services: name | protocol | port | auth | env_vars[NAMES] | evidence
- storage: type | name | migrations | evidence
- schemas: kind | paths[] | generation_commands[] | evidence

# algorithms
## hotspots
- module | path | invariants[] | complexity | perf_notes | evidence
## debugging
- common_failures[]; observability: logs[] metrics[] traces[]

# proposed_cursor_rule_files
- architecture.mdc, workflows.mdc, testing.mdc, integrations.mdc, algorithms.mdc, guardrails.mdc, style-<stack id>.mdc

# unknowns
- question | why_it_matters | best_guess_if_any | evidence

# evidence_index
- (every cited path)

CONSTRAINTS
- Relative paths only; prefer CI/README/presets/scripts; keep under ~300 lines; no invented commands.
```

---

## 2) AUTHOR → generate/update files from `repo_profile.md` (concise, diff‑first)

```text
TASK
Use repo_profile.md to create or update:
- .github/copilot-instructions.md
- AGENTS.md
- GEMINI.md
- .cursor/rules/*.mdc (every name under # proposed_cursor_rule_files; include one style-<stack id>.mdc per stack)

RULES
- Evidence-first: after any non‑obvious rule/command add a bullet **“Where this is proven:”** with exact paths from # evidence_index.
- Derive everything from # stacks / # workflows; don’t assume tools.
- Prefer presets/scripts from evidence; show preset first, generic fallback second.
- Redact secrets (keep env var names; placeholder values). Keep sections compact (≤ ~120 lines each).

UPDATE MODE (no fences)
- If file exists → update with minimal edits; preserve manual prose/headings.
- If file doesn’t exist → write full contents.
- Be idempotent (re-running without repo changes → no diff).

CONTENT (headings, in order)
1) .github/copilot-instructions.md → Purpose & Scope; Quick Start (per stack: setup/build/run/test/lint/format/typecheck/coverage/debug); Style & Conventions; Testing; Error & Logging; Performance; Safe Change Boundaries; Integration Points; PR Expectations; AI FAQ; Unknowns.
2) AGENTS.md → Read Me First; Allowed vs Disallowed; Common Tasks (per stack); Debugging Playbook; Integration Map; Patterns & Anti‑patterns; Safety & Secrets; Escalation/TODOs.
3) GEMINI.md → Context Packing; Diff‑friendly Directions; Validation Steps; Prompt Library; Final Checklist.
4) .cursor/rules/*.mdc → architecture, workflows, testing, integrations, algorithms, guardrails, style-<stack>. **Format:** concise bullets; each rule starts with **Rule:**; add **Evidence:** where non‑obvious; keep each file ≤ 120 lines.

OUTPUT
- **Change Log:** bullets summarizing merges/standardizations vs prior AI docs.
```

---

## 3) VERIFY → check & tighten (concise)

```text
TASK
Verify written files against repo_profile.md.

OUTPUT
- **Verification Report** (bullets).
- **Change Log:** bullets summarizing merges/standardizations vs prior AI docs.

CHECKLIST
- Each non‑obvious command has nearby “Where this is proven:” with paths from # evidence_index.
- Guidance matches discovered stacks/workflows; tools/config paths exist.
- Guardrails protect public APIs/wire formats/migrations.
- Integrations list ports/auth/env var NAMES only (no secrets).
- Unknowns present and deduplicated.
- Each .mdc ≤ 120 lines; concise bullets.
- Idempotent: re‑running Step 2 would produce no changes.
```

---

Would you like me to compress these **even further** into a one‑pager (super‑minimal) set, or is this level “small enough” for you?
