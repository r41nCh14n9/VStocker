# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VStocker — a project by Roy Chiang. Currently in early setup phase with no application code yet.

## Custom Slash Commands

This project uses a structured agent workflow via `.claude/commands/`. Each command auto-loads its relevant guidance documents from `docs/` before executing.

| Command | Purpose | Reads from | Writes to |
|---|---|---|---|
| `/plan` | Create project plans and roadmaps | `docs/plans/active/`, workflow guidelines | `docs/plans/` |
| `/sa` | System analysis, requirements decomposition | `docs/plans/active/`, tech stack guidelines | `docs/analysis/` |
| `/sd` | System design, architecture, API specs | `docs/analysis/requirements/`, arch guidelines | `docs/design/` |
| `/dev` | Feature implementation following all guidelines | `docs/reference/`, `docs/design/`, `docs/analysis/` | `src/`, `docs/implementation/` |
| `/review` | Code, design, and requirements review | `docs/reference/`, `docs/implementation/` | `docs/review/` |
| `/test` | Test plans and QA strategy | `docs/analysis/requirements/`, `docs/design/` | `docs/testing/` |
| `/reference` | Create/update guidelines, templates, examples | `docs/reference/` (current state) | `docs/reference/` |

## Intended Workflow Order

```
/plan → /sa → /sd → /dev → /review → /test
```

Each stage depends on the outputs of the previous stage. `/reference` can be run at any point to establish or update technical standards.

## Docs Directory Structure (produced by commands)

```
docs/
├── plans/active/           # Active project plans (read by /sa, /sd)
├── analysis/requirements/  # SA output: functional & NFR docs (read by /sd, /dev, /test)
├── design/                 # SD output: architecture, component, API, DB specs (read by /dev, /test)
├── reference/
│   ├── guidelines/         # GUIDELINES-*.md — mandatory reading for /dev and /review
│   ├── templates/          # TEMPLATE-*.ts / *.md — code structure templates
│   └── examples/           # good/ and anti-patterns/ — code pattern references
├── implementation/         # Dev output: plans, code records, self-checks
├── review/                 # Review output: code-reviews/, design-reviews/, requirements-reviews/
└── testing/                # Test output: integration/, user/, unit/
```

## Reference Material Naming Convention

```
GUIDELINES-[Subject]-v[N].md      (e.g. GUIDELINES-Tech-Stack-v1.md)
TEMPLATE-[Type].ts                (e.g. TEMPLATE-Component.ts)
EXAMPLE-[Type]-[Subject].ts       (e.g. EXAMPLE-Service-Authentication.ts)
ANTIPATTERN-[Subject].ts
```

All reference files are versioned. When updating, increment the version number rather than overwriting.
