# Koupreng Design Engineering Standard V6.0

This is the canonical project design policy for Codex and Google Antigravity.
It applies to future UI/UX and frontend requests across the public site,
authentication, host and admin dashboards, invitation templates, editor and
preview, guest and RSVP flows, commerce and payment, Telegram interfaces,
settings, and phone, tablet, and desktop states. This policy itself authorizes
no application feature or visual change.

## Authority and existing design

Follow the user's active request, security and business contracts, the
[UX/UI master scope](docs/uxui/MASTER_SCOPE.md), and current source before
applying external advice. Preserve Khmer/English localization, each invitation
template's identity, creator data roundtrips, previews, authorization,
server-owned prices and entitlements, USD/KHR separation, payment integrity,
and applied migrations. The current [frontend user design system](docs/uxui/FRONTEND_USER_DESIGN_SYSTEM.md)
and [template art direction](docs/uxui/FRONTEND_USER_TEMPLATE_ART_DIRECTION.md)
are evidence to revalidate against source, not a license to flatten every
surface into one visual theme. The live semantic token source is
`apps/frontend-user/src/shared/styles/semantic-tokens.css`.

## Original skill and research collections

The collections below are installed at the user level. For every relevant
request, inspect each collection's skill descriptions during planning and
again at final review. Load and follow the original applicable `SKILL.md` and
its references before using that workflow. Work through focused phases: one
primary and at most two supporting skills are active in a phase. Explain a
collection's genuine inapplicability, missing installation, or incompatibility
in the handoff. Do not rewrite, combine, or vendor these skills into Koupreng.

| Collection | Relevant use |
| --- | --- |
| [GStack](https://github.com/garrytan/gstack) | Engineering planning, design review, browser QA, code review, and performance checks. |
| [Emil Kowalski](https://github.com/emilkowalski/skills) | Motion, choreography, gestures, design engineering, and animation performance. |
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Searchable UX guidance, design system choices, responsive patterns, and accessibility. |
| [Frontend Design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Distinctive art direction, typography, and frontend craft. |
| [Stageshow](https://github.com/benjitaylor/skills) | Product demos and visual storytelling when requested or useful to the surface. |
| [Impeccable](https://github.com/pbakaus/impeccable) | Critique, audit, adaptation, polish, and design system documentation. |
| [Dimensional Drawing](https://github.com/enesozturk/dimensional-drawing) | Measured component specifications and motion drawings when useful. |
| [Oil UI](https://github.com/oil-oil/oil-ui) | Alternative visual directions and screenshot based comparison. |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Intentional visual taste and browser checked frontend quality. |
| [Brand Identity](https://github.com/fatihaydost/brand-identity-skill) | Brand direction, type, color, and logo exploration when in scope. |
| [Awwwards companion skills](https://github.com/INSANE0777/awwwards-skills) | Inspiration, design evidence, motion study, and setup diagnostics. |
| [Awwwards MCP](https://github.com/INSANE0777/Awwwards-mcp) | Read-only public design research through its configured research tools, when reachable. |

## Design intelligence and decisions

Use [60fps.design](https://60fps.design/), [Awwwards](https://www.awwwards.com/),
[Dribbble](https://dribbble.com/), and [Laws of UX](https://lawsofux.com/)
as research references when relevant. Apply Gestalt principles, Nielsen's
usability heuristics, [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/), modern
design systems and tokens, mobile-first layout, Khmer and English typography,
reduced-motion behavior, and measured performance. Treat external work as
inspiration; do not copy unlicensed assets, protected content, or a site's
identity. Resolve conflicting advice in favor of Koupreng's cultural identity,
the active user's intent, usability, accessibility, and performance.

Aim for premium, distinct work without generic cards, gratuitous gradients,
unnecessary effects, inconsistent type, or decoration without a purpose.
Ceremonial invitation scenes may be richer than dense management screens, but
essential tasks must work with reduced motion, keyboard input, slow networks,
and fallback rendering. Cover loading, skeleton, empty, error, success,
disabled, and offline states as applicable.

## Execution and verification for future UI requests

1. Audit current routes, states, source, manifests, visual evidence, and user flows.
2. Consult every collection above; select relevant original workflows and explain exclusions.
3. Research public references safely. If Awwwards MCP is blocked, record that result and use accessible public references.
4. Establish the brand and template-specific direction; explore alternatives where useful. Do not introduce a new visual system without reconciling existing tokens.
5. Build focused, maintainable changes using the applicable design, motion, and component specification workflows.
6. Run GStack and other relevant design, engineering, security, browser, accessibility, responsive, and performance reviews.
7. Fix measured problems and repeat focused checks. Record before/after evidence, commands and real results, limitations, and a handoff.

Never let design changes bypass React/TypeScript behavior, Spring Boot APIs,
MySQL integrity, ABA PayWay controls, Telegram automation, localization, or
other existing business rules. The 27-phase master scope remains planning
reference material until the user authorizes a specific phase.
