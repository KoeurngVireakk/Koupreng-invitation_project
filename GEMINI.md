@./AGENTS.md

# Google Antigravity Agent Guide

## Skill Routing & Workspace Discovery
- The Antigravity VS Code extension discovers workspace skills from `.agents/skills/` and global skills from `~/.gemini/config/skills/`. Do not duplicate skill directories in this repository.
- Always consult [`.agents/ROUTER.md`](.agents/ROUTER.md) first to select the single primary skill and optional supporting skills.
- For UI/UX and frontend work, read the canonical [DESIGN.md](DESIGN.md), consider all its collections, and activate applicable original skills in focused phases.
- Read only the required `SKILL.md` and relevant reference documentation.
- Maintain minimal context by loading files with precise line slices when inspecting source code.
- Enforce the precedence hierarchy in `AGENTS.md`: Security > Framework Contracts > Koupreng Skills > Vendor Skills > Generic Styling.

