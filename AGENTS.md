# AGENTS.md — TCG Intelligence

## Mission
Build TCG Intelligence into a real, commercially usable Pokémon TCG collection/intelligence product. Prioritize working software, maintainability, tests, and a distinctive editorial UI.

## Working style
- Read this file, `START-HERE.md`, `README.md`, `CODEX-PROMPT.md`, `DESIGN-SPEC.md`, and `LICENSE-NOTES.md` before changing code.
- Work incrementally in coherent features. Do not attempt the entire roadmap in one unreviewable change.
- Use descriptive commits for real completed work only. Never create empty/artificial commits or split trivial edits only to inflate activity.
- Before every PR: install dependencies, run lint, typecheck, tests, and build; fix failures you introduce.
- Use branches named `codex/<feature>`.
- Open focused PRs to `main` with a concise summary, test evidence, screenshots for visual changes, and known limitations.
- Do not expose secrets. Keep `.env.example` current.
- Do not silently invent live prices, marketplace availability, or scanner confidence. Label demo/fallback data explicitly.

## Product priorities
1. Bootstrap/quality: make the current monorepo build reliably.
2. Catalog search/details with TCGdex.
3. PostgreSQL/Prisma collection persistence.
4. Scanner pipeline: image preprocessing → OCR → candidate matching → user confirmation.
5. Price snapshots/history with auditable source/currency/timestamp.
6. Opportunity Score using real stored observations where available.
7. Wishlist and alerts.
8. Auth and user accounts.
9. Multi-card/binder scanner.
10. Telegram and sealed products.

## Design direction
The UI must be original but follow the supplied references in `docs/design/`:
- Burgundy / wine as the dominant dark tone.
- Cream / warm off-white content surfaces.
- Elegant editorial serif display typography paired with a restrained sans-serif for utility text.
- Fine borders, generous whitespace, magazine-like hierarchy.
- Premium collector/investment feel; avoid generic neon gaming dashboards.
- Desktop and mobile must feel like one product system.
- Keep card art the visual hero; application chrome should be quiet.

## Open-source / licensing
- Only copy/adapt code from dependencies/projects whose licenses allow the intended commercial use (e.g. MIT, BSD, Apache-2.0), and comply with attribution/notice requirements.
- GPL/AGPL projects may be studied as architectural references only unless the project owner explicitly changes the licensing plan.
- Record any reused/adapted third-party code in `THIRD_PARTY_NOTICES.md` with project, URL, license, files/ideas reused, and modifications.
- Do not copy code when license status is missing or unclear.

## Architecture expectations
- Web: Next.js 15, React 19, TypeScript strict.
- Database: PostgreSQL + Prisma.
- Scanner: FastAPI + OpenCV + Tesseract, with clear confidence/candidate semantics.
- Redis is optional until jobs/caching need it; do not introduce accidental complexity.
- Keep external API integrations server-side where credentials/rate limiting may matter.
- Prefer small domain modules and explicit types over monolithic route/components.

## Definition of done
A feature is done only when:
- it works end-to-end in a fresh checkout using documented steps;
- user-facing error/loading/empty states exist;
- tests cover meaningful business logic;
- lint/typecheck/build succeed;
- docs/env examples are updated when necessary;
- demo behavior cannot be mistaken for real market data.
