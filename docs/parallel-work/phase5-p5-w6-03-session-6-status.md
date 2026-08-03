# P5-W6.6 Session 6 Status

- Task: `P5-W6.6` — project workflow skills
- Status: `BLOCKED FOR MAIN REVIEW` — the requested skills are complete, but
  the required project gates reject their mandated `.agents/skills/` paths.
- Base commit: `e8f5555` (`docs(office-v2): select Phase 5 wave 3`)
- Branch/worktree: `task/session-6-p5-w6-6-skills` /
  `C:\Users\WINDOW XI\.codex\worktrees\phase5-p5-w6-6-skills`

## Scope lock

Own only the three requested `.agents/skills/` directories, generated
`agents/openai.yaml` metadata, and this status record. Do not edit the clean-
room gate, implementation, assets, schemas, manifests, backlog, or final
reports.

## Scaffold evidence

Each command used the installed skill-creator scaffold:

```text
python scripts\init_skill.py author-office-v2-asset-family --path C:\Users\WINDOW XI\.codex\worktrees\phase5-p5-w6-6-skills\.agents\skills --interface display_name=Author Office V2 Asset Family --interface short_description=Build deterministic Office V2 asset families --interface default_prompt=Use $author-office-v2-asset-family to build and validate an Office V2 asset family.
[OK] Created skill directory: ...\.agents\skills\author-office-v2-asset-family
[OK] Created SKILL.md
[OK] Created agents/openai.yaml
```

The same scaffold output (`[OK] Created skill directory`, `[OK] Created
SKILL.md`, `[OK] Created agents/openai.yaml`) was produced for
`compose-office-v2-room` and `review-office-v2-visuals` with their matching
metadata and default prompts.

## Validation evidence

```text
python scripts\quick_validate.py ...\.agents\skills\author-office-v2-asset-family
Skill is valid!

python scripts\quick_validate.py ...\.agents\skills\compose-office-v2-room
Skill is valid!

python scripts\quick_validate.py ...\.agents\skills\review-office-v2-visuals
Skill is valid!
```

Project skill preflight:

```text
node .agents/skills/build-office-v2-engine/scripts/preflight.mjs
[architecture.office-v2.unapproved-root] .agents/skills/author-office-v2-asset-family/agents/openai.yaml: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/author-office-v2-asset-family/SKILL.md: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/compose-office-v2-room/agents/openai.yaml: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/compose-office-v2-room/SKILL.md: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/review-office-v2-visuals/agents/openai.yaml: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/review-office-v2-visuals/SKILL.md: Office file is outside the exact V2 clean-room roots.
```

Exit code: `1`.

Diff hygiene:

```text
git diff --check
```

Exit code: `0` (no output before staging).

Full project check:

```text
npm run check
Repository structure OK: 725 files, 10 agents, 0 validated assets.
[architecture.office-v2.unapproved-root] .agents/skills/author-office-v2-asset-family/agents/openai.yaml: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/author-office-v2-asset-family/SKILL.md: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/compose-office-v2-room/agents/openai.yaml: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/compose-office-v2-room/SKILL.md: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/review-office-v2-visuals/agents/openai.yaml: Office file is outside the exact V2 clean-room roots.
[architecture.office-v2.unapproved-root] .agents/skills/review-office-v2-visuals/SKILL.md: Office file is outside the exact V2 clean-room roots.
```

Exit code: `1` at `office:v2:clean-room:check`.

## Blocker

`scripts/office-v2-clean-room-check.mjs` allows only
`.agents/skills/build-office-v2-engine/` under `.agents/skills/`. The required
skill names necessarily contain `office-v2` and therefore trigger its exact
path rule. Resolving this requires Main to approve an allowlist/Decision 0007
change outside this worker's locked scope, then rerun preflight and
`npm run check`. Do not weaken or bypass the gate in this branch.

## Handoff

The three skills and all scaffold metadata pass their individual validators;
no approval or Phase 5 closure is claimed. Stage and commit only the three
skill directories and this status record after the final staged diff check,
then report the commit and the clean/blocked gate evidence to Main.

Final staged scope check:

```text
git diff --cached --check
```

Exit code: `0` (no output). The staged paths were exactly the six skill files
and this status record; no implementation, asset, schema, manifest, backlog,
or final-report file was staged.
