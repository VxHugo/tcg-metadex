# Codex operating instructions — TCG MetaDex

## Mission
Build TCG MetaDex as a production-minded Pokémon TCG intelligence product: catalog, collection, card scanner, price history, opportunity scoring, alerts and later Telegram/affiliate connectors.

## Product direction
- Visual language: editorial, premium, cream/off-white canvas, deep wine/burgundy accents, thin borders, generous whitespace, serif/display typography, card/image compositions inspired by a printed magazine.
- Do NOT copy copyrighted layouts pixel-for-pixel. Recreate the visual language and interaction patterns as an original interface.
- Mobile-first and responsive.
- User-facing language: pt-BR by default.

## Technical baseline
- Web: Next.js 15 + React 19 + TypeScript.
- Catalog source: TCGdex REST API behind server-side routes/services.
- Database: PostgreSQL + Prisma.
- Cache/jobs: Redis when useful.
- Scanner service: FastAPI + OpenCV + Tesseract; keep recognition behind an interface so OCR/vision providers can be swapped later.
- Local development should work with Docker Compose.

## How to work
1. Read README.md and open issues before coding.
2. Work on ONE meaningful vertical slice at a time.
3. Create a dedicated branch for each issue: `codex/<issue>-short-name`.
4. Implement the smallest complete version, including error/loading/empty states.
5. Run relevant tests, typecheck and lint before finishing.
6. Commit only real completed work. Never create empty/no-op commits or split changes solely to inflate contribution counts.
7. Use conventional, descriptive commit messages such as `feat(collection): persist cards in postgres`.
8. Push the branch and open a PR to `main` with summary, screenshots when UI changes, test evidence, known limitations and follow-up work.
9. Do not merge a failing PR. Prefer small reviewable PRs over giant rewrites.
10. After one issue is complete, continue with the next highest-priority open issue unless blocked.

## Architecture rules
- Keep TCGdex calls server-side where practical and normalize external payloads into internal domain types.
- Never hardcode real marketplace prices as if live. Clearly label demo/synthetic data.
- Price records must include source, currency, observedAt and variant/condition where available.
- Opportunity Score must be deterministic and explainable: price discount, recency, liquidity/confidence and condition/source quality should be visible inputs.
- Persist collection data in PostgreSQL; localStorage is allowed only for an explicitly labeled demo/fallback mode.
- Scanner results must expose confidence and require confirmation when below threshold.
- Add indexes/constraints for card external IDs, price timestamps and collection uniqueness as appropriate.
- Keep secrets in environment variables; update `.env.example`, never commit credentials.

## Legal/licensing
- Only copy/adapt source code when its license permits it and preserve required attribution/notices.
- MIT/BSD/Apache code may be adapted with required notices. Treat AGPL/GPL projects as reference-only unless the repository intentionally adopts the corresponding obligations.
- Do not scrape sources whose terms prohibit it. Prefer official/public APIs or user-provided data.
- Pokémon names/art are third-party IP; keep a fan-made/non-affiliation notice and do not bundle unauthorized card artwork.

## Definition of done for each PR
- Feature works end-to-end for its stated scope.
- Typecheck/lint/tests pass or the PR clearly documents an unavoidable blocker.
- No secrets, generated caches, `__pycache__`, build artifacts or dependency directories committed.
- README/docs updated when setup or behavior changed.
- Accessibility basics: keyboard usage, labels, semantic controls and useful alt text.
- Responsive at phone and desktop widths.

## Priority order
1. Bootstrap complete monorepo and CI.
2. PostgreSQL persistence for collection + API.
3. Catalog synchronization/normalization from TCGdex.
4. Price snapshots + price-history UI.
5. Real Opportunity Score with explainability.
6. Scanner reliability and multi-card workflow.
7. Wishlist/master-set tracking.
8. Alerts + Telegram worker.
9. Authentication and multi-user support.
10. Production hardening, observability and deployment docs.
