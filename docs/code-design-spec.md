# Code Design Spec — `AliceNN-ucdenver/celeb-api`

_Seeded by Cheshire greenfield scaffold for OKR `OKR-2026Q2-IMDB-001-celeb-api`._

## Source artifact

The canonical design lives in the governance mesh repo:

- **Repo:** `AliceNN-ucdenver/alicenn-ucdenver-governance-mesh`
- **Path:** `okrs/OKR-2026Q2-IMDB-001-celeb-api/what/code-design.md`
- **Link:** [`okrs/OKR-2026Q2-IMDB-001-celeb-api/what/code-design.md`](https://github.com/AliceNN-ucdenver/alicenn-ucdenver-governance-mesh/blob/main/okrs/OKR-2026Q2-IMDB-001-celeb-api/what/code-design.md)

## Implemented slice

This repo now exposes the `celeb-profile-v1` contract as a public, read-only HTTP endpoint:

- `GET /v1/celebs/:celebId`
- Input validation on `:celebId` via allowlisted `celeb-<slug>` ids
- Policy-shaped response that only exposes the safe public profile payload
- Security headers, origin allowlist, and in-memory rate limiting on the public endpoint

The exported TypeScript contract lives in `src/contracts/celebProfile.ts`.

## Implementation agent checklist

1. Fetch the source artifact at the link above.
2. Read your per-repo extract under `## 1. Project Structure`.
3. Read sibling-repo coordination from the landing issue body.
4. Plan + implement + run Tweedles persona-switch self-critique (Architect + Security).
5. Open the impl PR with the `implementation_chain` Hatter Tag continuation block per `.github/agents/implementation-agent.agent.md`.

---

_Future: this stub should be replaced by the extracted §1 sub-block content for `AliceNN-ucdenver/celeb-api` at scaffold time. Current scaffold writes the pointer + checklist only; the agent fetches the full extract from the mesh._
