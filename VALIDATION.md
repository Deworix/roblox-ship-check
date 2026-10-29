# Validation and limits — 29 October 2026

Author-run checks on Windows x86_64:

- Lune **0.11.1** executed the actual `failure-lab.luau`: **26/26 fixture assertions**. Three deliberately broken behaviors were detected; the corresponding corrected in-memory transitions and edge cases passed.
- Node's real test runner passed **18/18** report-checker tests, including unexecuted PASS rejection, missing baseline/evidence/runtime, blocked output, malformed JSON, Unicode paths/BOM, help, oversized input and invocation through a linked skill directory.
- The bundled Skill Creator frontmatter validator passed. Agent UI metadata names the same skill.
- The official `skills` CLI installed the local pack into an isolated project with the explicit `claude-code`, `codex` and `cursor` targets. `skills list --json` reported those three clients and project scope. No user/global skill or MCP config was changed; install telemetry was disabled with `DO_NOT_TRACK=1`.

Version 0.1.1 fixes the report checker's executable-entry detection when a skill directory is linked rather than copied. A real directory-link regression test failed on 0.1.0 and passed after comparing resolved file paths. Use 0.1.1 or later for the checker; the fixture lab itself is unchanged.

This proves the tested code and local installer behavior, **not three authenticated AI end-to-end sessions**. The pack cannot itself supply Studio access. No live Studio session, live DataStore, real purchase, customer project, platform certification or AI behavior evaluation is claimed by these checks. Studio Command Bar instructions describe how to run the same self-contained Luau; this validation run used Lune.

The public workflow reruns the Node tests and actual Luau fixtures on a standard Ubuntu runner. Lune's pinned archive digest is verified before executing it; GitHub's checkout/setup-node actions are pinned to the verified release commits. There are no secrets, paid/larger runners, uploaded CI artifacts or package publishing steps.

The source pack contains no app source or customer data. Tests use temporary local files and remove only the test directory they create. The report checker has no network, shell, plugin installation or report-writing operation. Its consistency result is not independent proof that an agent's cited evidence is real.

Primary references: [Roblox Data stores](https://create.roblox.com/docs/cloud-services/data-stores), [client/server boundary](https://create.roblox.com/docs/scripting/security/client-server-boundary), [Agent Skills specification](https://agentskills.io/specification), [skills CLI](https://github.com/vercel-labs/skills), [Lune installation](https://lune-org.github.io/docs/getting-started/1-installation/).
