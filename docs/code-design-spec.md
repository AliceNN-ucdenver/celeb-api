# Code Design Spec — `AliceNN-ucdenver/celeb-api`

_Committed by the Looking Glass fan-out for OKR `OKR-2026Q2-IMDB-001-celeb-api` (delivered at dispatch — greenfield + brownfield)._

## Source artifact

- **Repo:** `AliceNN-ucdenver/alicenn-ucdenver-governance-mesh`
- **Path:** `okrs/OKR-2026Q2-IMDB-001-celeb-api/what/code-design.md`
- **Link:** [`okrs/OKR-2026Q2-IMDB-001-celeb-api/what/code-design.md`](https://github.com/AliceNN-ucdenver/alicenn-ucdenver-governance-mesh/blob/main/okrs/OKR-2026Q2-IMDB-001-celeb-api/what/code-design.md)

## How to read this

The **full canonical WHAT-phase design is inlined below** — frozen at WHAT
dispatch and committed into this repo by the fan-out at dispatch time, so
you ground against it **locally** (no mesh-repo access required). The design is a
shared, multi-repo artifact; **your** per-repo slices are the H3 sub-blocks
naming `AliceNN-ucdenver/celeb-api` (slug in §1; short name + role in §2–§4):

- **§1 Project Structure** — your layout
- **§2 API Endpoint Specifications** — your **binding contract**. Endpoint
  paths and request/response field names + shapes are acceptance criteria,
  not suggestions: the provenance gate diffs your exposed contract against
  this — drift (renamed fields, changed paths, missing endpoints) fails the PR.
- **§3 Data Models** + **§4 Authentication** — your models + auth
- **§5–§10** — shared across all target repos (security controls, config,
  error handling, testing, deployment, rationale)

Sibling-repo sub-blocks are kept for cross-repo contract coordination (also
summarised in the landing-issue body).

> ⚠️ The inlined doc’s YAML frontmatter (`chain_root_hash`, `run_id`, …) and
> any trailing `### Self-review — Code-*` sections belong to the **WHAT-phase
> design agent** — they are NOT your `implementation_chain`. Your
> `parent_chain_root` comes from the landing issue; compute your own
> `chain_root_hash` per `.github/agents/implementation-agent.agent.md`.

## Implementation agent checklist

1. Read your per-repo slices below (§1–§4, the `AliceNN-ucdenver/celeb-api` sub-blocks); treat §2 as the binding contract.
2. Read sibling-repo coordination from the landing-issue body.
3. Plan + implement + run the Tweedles persona-switch self-critique (Architect + Security) via the runner skills.
4. Open the impl PR with the `implementation_chain` Hatter Tag continuation block per `.github/agents/implementation-agent.agent.md`.

---

# Canonical WHAT-phase design — inlined snapshot

---
phase: what
okr_id: OKR-2026Q2-IMDB-001-celeb-api
run_id: WHAT-2026-05-28-7rr3tt
intent_thread_uuid: 1aa60f3d-6908-4ea4-bad6-42d247e5fb77
parent_intent_thread: 1aa60f3d-6908-4ea4-bad6-42d247e5fb77
governance_tier: supervised
author_did: did:github:copilot-swe-agent
reviewer_dids: []
evidence_mode: code
audit:
  chain_root_hash: 923fa122c53bf985b145bb298c66a922b6730d52a72af1e2473568fcf0d06de9
---

## 1. Project Structure

### `AliceNN-ucdenver/celeb-api`
---
repo: AliceNN-ucdenver/celeb-api
mode: greenfield
status: create
language: typescript
framework: express
addresses: [FR-01, FR-02, FR-03, SR-01, SR-02, SR-03, SR-04]
fanout_wave: 1
coordination_role: provider
depends_on: []
provides:
  - celeb-profile-v1
consumes: []
---

Scaffolding spec (from `knowledge-code` greenfield hints: TypeScript + Express + seed files):

```text
.
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── routes/celebrities.ts
│   ├── middleware/authz.ts
│   ├── middleware/rateLimit.ts
│   ├── middleware/requestContext.ts
│   ├── services/disambiguationService.ts
│   ├── services/licensePolicyService.ts
│   ├── services/profileAssembler.ts
│   ├── models/celebrityProfile.ts
│   ├── models/licensePolicy.ts
│   ├── db/mongo.ts
│   ├── telemetry/metrics.ts
│   └── errors/apiErrors.ts
├── tests/
│   ├── unit/disambiguationService.test.ts
│   ├── unit/licensePolicyService.test.ts
│   └── integration/celebrities.get-by-id.test.ts
└── .github/workflows/red-queen-bootstrap.yml
```

### `AliceNN-ucdenver/imdb-react-frontend`
---
repo: AliceNN-ucdenver/imdb-react-frontend
mode: brownfield
status: connected
language: typescript
framework: react
addresses: [FR-04, FR-01, SR-02, SR-04]
cited_paths: [src/services/apiClient.ts, src/config/env.ts, src/pages/MovieDetailPage.tsx, src/types/movie.ts, src/__tests__/services/apiClient.test.ts, src/__tests__/pages/MovieDetailPage.test.tsx]
new_paths: [src/services/celebApiClient.ts, src/types/celebrity.ts, src/components/CelebrityProfileCard.tsx, src/__tests__/services/celebApiClient.test.ts, src/__tests__/components/CelebrityProfileCard.test.tsx]
fanout_wave: 2
coordination_role: consumer
depends_on: [AliceNN-ucdenver/celeb-api]
provides: []
consumes:
  - celeb-profile-v1
---

Brownfield reuse and modifications grounded on inventory paths:
- Reuse `apiFetch<T>(path, options)` from `src/services/apiClient.ts` for movie-api calls only (it prepends `${VITE_API_BASE_URL}${path}`, injects `Authorization`, `X-Correlation-ID`, CSRF for mutating methods, and maps 401/403/5xx to redirects/errors).
- Add sibling helper `src/services/celebApiClient.ts` (new path) for celebrity service base URL to avoid malformed dual-base concatenation.
- Extend `src/config/env.ts` zod schema with `VITE_CELEB_API_BASE_URL` and telemetry endpoint names used for profile confidence dashboards.
- Extend `src/types/movie.ts` cast model with optional celebrity-profile reference fields and add `src/types/celebrity.ts` for the new contract.
- Modify `src/pages/MovieDetailPage.tsx` to fetch and render celebrity profile envelope data using `celebFetch` + `sanitizeText`/`sanitizeHtml` from `src/utils/sanitize.ts`.
- Add component `src/components/CelebrityProfileCard.tsx` for provenance/license badges and confidence rendering.

## 2. API Endpoint Specifications

### celeb-api (provider)

1) `GET /api/celebrities/:id`
- Auth: no (public read)
- Rate limit: 120 req/min per IP
- Request type:
```typescript
interface GetCelebrityByIdRequest {
  params: { id: string };
  query: { disambiguation_id?: string };
}
```
- Response type (business-state in typed body, not thrown):
```typescript
interface SourceProvenance {
  source: 'wikidata' | 'tmdb' | 'internal';
  source_id: string;
  retrieved_at: string;
  license_tag: string;
}

type IdentityStatus = 'resolved' | 'ambiguous' | 'manual_review_required';

interface CelebrityProfileResponse {
  canonical_id: string;
  display_name: string;
  confidence_score: number;
  identity_status: IdentityStatus;
  source_provenance: SourceProvenance[];
  license_policy: {
    policy_version: string;
    allowed_fields: string[];
    denied_fields: string[];
  };
  biography?: string;
  filmography?: Array<{ title: string; year: number; role: string }>;
}
```
- Status codes: `200` (resolved/ambiguous/manual_review_required body), `404` (unknown id), `451` (license-blocked), `429` (rate limited), `500`.

2) `POST /api/celebrities/resolve`
- Auth: yes (`reviewer` or `admin` role)
- Rate limit: 30 req/min per token
- Request:
```typescript
interface ResolveCelebrityRequest {
  external_candidates: Array<{ source: string; source_id: string; display_name: string }>;
  canonical_hint?: string;
}
```
- Response: `202 { identity_status: 'manual_review_required' }` or `200 { identity_status: 'resolved' }`.

### imdb-react-frontend (consumer)

Use `celebFetch` (new helper) for celeb-api calls, not `apiFetch`, because `apiFetch` is fixed to `VITE_API_BASE_URL`.

```typescript
export async function celebFetch<T>(
  path: string,
  options: RequestInit & { method?: string } = {}
): Promise<T> {
  const baseUrl = import.meta.env['VITE_CELEB_API_BASE_URL'];
  return fetchWithSharedGuards<T>(`${baseUrl}${path}`, options);
}
```

`MovieDetailPage` flow:
- Existing: `apiFetch<Movie>(/api/movies/:id)` + `apiFetch<Review[]>(/api/movies/:id/reviews)` in `src/pages/MovieDetailPage.tsx`.
- New: `celebFetch<CelebrityProfileResponse>(/api/celebrities/:actorId)` for each cast member via bounded concurrency (max 3 parallel).

## 3. Data Models

### celeb-api models

```typescript
// src/models/celebrityProfile.ts
interface CelebrityProfileDocument {
  canonical_id: string;                // indexed unique
  display_name: string;
  aliases: string[];
  confidence_score: number;            // 0..1
  identity_status: 'resolved' | 'ambiguous' | 'manual_review_required';
  source_provenance: Array<{
    source: string;
    source_id: string;
    license_tag: string;
    retrieved_at: Date;
  }>;
  license_policy: {
    policy_version: string;
    allowlist: string[];
    denylist: string[];
    decision_cached_until: Date;
  };
  updated_at: Date;
}
```

Indexes:
- `{ canonical_id: 1 }` unique
- `{ display_name: "text", aliases: "text" }` for candidate retrieval
- `{ identity_status: 1, confidence_score: 1 }` for review queue triage

### imdb-react-frontend models

```typescript
// src/types/celebrity.ts (ADD)
export interface CelebrityProfile {
  canonical_id: string;
  display_name: string;
  confidence_score: number;
  identity_status: 'resolved' | 'ambiguous' | 'manual_review_required';
  source_provenance: Array<{ source: string; source_id: string; license_tag: string }>;
  license_policy: { policy_version: string; allowed_fields: string[]; denied_fields: string[] };
  biography?: string;
}

// src/types/movie.ts (MODIFY)
export interface CastMember {
  actorId: string;
  actorName: string;
  characterName: string;
  celebrityCanonicalId?: string; // ADD
}
```

Validation:
- celeb-api request/response schemas via zod before persistence/serialization.
- frontend response narrow-check for `identity_status` union before rendering.

## 4. Authentication Middleware Implementation

### celeb-api

Use JWT+RBAC middleware aligned to ADR-003 expectations:

```typescript
// src/middleware/authz.ts
export function requireRoles(...allowed: Array<'reviewer' | 'admin'>) {
  return (req, res, next) => {
    const claims = verifyJwt(req.headers.authorization);
    if (!claims || !allowed.includes(claims.role)) {
      return res.status(403).json({ error: { code: 'forbidden' } });
    }
    req.user = claims;
    return next();
  };
}
```

Apply to write/resolve endpoints only; keep `GET /api/celebrities/:id` public read.

### imdb-react-frontend

Keep existing `configureApiClient` and token provider integration from `src/services/apiClient.ts`; mirror same auth headers and correlation propagation in `src/services/celebApiClient.ts`.

## 5. Security Control Implementations

- **SR-01 (OWASP A01/A05, STRIDE-Spoofing THR-001):** JWT signature + role claim validation on privileged celeb write/resolve routes.
- **SR-02 (OWASP A01/A02, STRIDE-InformationDisclosure THR-002):** deny-by-default field serialization; response builder emits only allowlisted fields from `license_policy`.
- **SR-03 (OWASP A03/A08, STRIDE-Tampering THR-003):** zod validation for ids/queries, parameterized Mongo queries, strict parser settings for external payloads.
- **SR-04 (OWASP A09/A10, STRIDE-Repudiation THR-004):** immutable audit events for denied fields, low-confidence routing, and privileged updates with correlation ID and actor role.

Frontend controls:
- Continue `sanitizeText` and `sanitizeHtml` exact exports from `src/utils/sanitize.ts`.
- Keep `X-Correlation-ID` forwarding behavior mirrored in `celebFetch` helper.

## 6. Configuration and Environment Variables

```typescript
const Config = z.object({
  CELEB_API_PORT: z.coerce.number().default(8081),
  CELEB_DB_URL: z.string().url(),
  CELEB_JWT_JWKS_URL: z.string().url(),
  CELEB_LICENSE_POLICY_SOURCE_URL: z.string().url(),
  CELEB_LICENSE_CACHE_MAX_STALE_SECONDS: z.coerce.number().default(86400),
  CELEB_PROFILE_CACHE_TTL_SECONDS: z.coerce.number().default(900),
  CELEB_CONFIDENCE_REVIEW_THRESHOLD: z.coerce.number().min(0).max(1).default(0.72),
  TELEMETRY_BACKEND: z.enum(['prometheus', 'datadog', 'cloudwatch']).default('prometheus'),
  METRIC_CELEB_PROFILE_P95_MS: z.string().default('celeb_profile_latency_ms'),
  METRIC_CELEB_FALSE_MERGE_RATE: z.string().default('celeb_false_merge_rate'),
  METRIC_CELEB_CONFIDENCE_DISTRIBUTION: z.string().default('celeb_confidence_distribution'),
  METRIC_CELEB_LICENSE_DENIED_FIELDS: z.string().default('celeb_license_denied_fields_total'),
});
```

Frontend (`src/config/env.ts`) additions:
- `VITE_CELEB_API_BASE_URL` (required URL)
- `VITE_CELEB_TELEMETRY_ENDPOINT` (optional URL)

## 7. Error Handling Patterns

True error classes only (business-state ambiguity remains typed response field):

```typescript
class CelebrityNotFoundError extends ApiError { statusCode = 404; code = 'celebrity_not_found'; }
class LicenseBlockedError extends ApiError { statusCode = 451; code = 'license_blocked'; }
class UpstreamDependencyError extends ApiError { statusCode = 503; code = 'upstream_unavailable'; }
```

Global handler returns:
```json
{ "error": { "code": "license_blocked", "message": "Policy denied field release", "trace_id": "..." } }
```

`identity_status='manual_review_required'` is returned as normal contract data, not an exception.

## 8. Testing Strategy with Example Test Cases

### imdb-react-frontend (brownfield)

Reuse and extend existing tests in `src/__tests__/services/apiClient.test.ts` and `src/__tests__/pages/MovieDetailPage.test.tsx`.

Add tests:
- `src/__tests__/services/celebApiClient.test.ts` (new): verifies base URL uses `VITE_CELEB_API_BASE_URL`, mirrors correlation/auth/timeout handling.
- `src/__tests__/components/CelebrityProfileCard.test.tsx` (new): verifies `identity_status` rendering and license-denied field badges.

Example mocking (must mock new helper actually used by page):

```typescript
vi.mock('@/services/celebApiClient', () => ({
  celebFetch: vi.fn(),
}));
```

### celeb-api (greenfield)

- Unit: disambiguation scoring, deny-by-default serialization, role middleware.
- Integration: `GET /api/celebrities/:id` success/ambiguous/manual-review, `451` policy block, `429` limit.
- Dependency mocks: external enrichment and license policy provider; do not mock Mongo behavior in integration tests.

## 9. Deployment Configuration

- Containerize celeb-api service separately from movie-api.
- Frontend deployment adds `VITE_CELEB_API_BASE_URL` via runtime env injection.

Failure-mode behavior:
- License provider down: serve cached decision if cache age <= `CELEB_LICENSE_CACHE_MAX_STALE_SECONDS`; else return `503` + `Retry-After`.
- Mongo down: return `503`; no alternate write path.
- Upstream enrichment down: return last-known cached profile with `X-Profile-Data-Stale: true` and provenance timestamp.
- Frontend when celeb-api unreachable: keep movie detail page rendering; show non-blocking “profile temporarily unavailable” panel.

Health/readiness:
- `/healthz` liveness
- `/readyz` verifies DB connectivity + license cache freshness threshold.

## 10. Design Rationale & Research Traceability

- **Patent alignment:** Use commodity staged entity resolution and explicit confidence output to reduce novelty risk under disambiguation-related prior art (`US20250307252A1`, `US11741163`, `US12591606`) while avoiding proprietary heuristic claims.
- **JTBD alignment:** The design centers a trusted identity envelope (`canonical_id`, `confidence_score`, provenance, license policy) to satisfy the primary job of returning the right celebrity profile quickly and safely.
- **Whitespace capture:** Implements governance-safe enrichment (confidence + licensing in one API path), directly addressing the identified market gap in combined disambiguation + rights control.
- **Community/practitioner alignment:** Two-stage retrieval + merge and deny-by-default policy filtering follow the WHY-phase implementation/security findings (`S19/S20` and `S1/S11/S12`).

NFR-to-alert mapping:

| NFR | Target | Alert threshold | Implementation mapping |
|---|---|---|---|
| NFR-01 latency | p95 < 200ms | `METRIC_CELEB_PROFILE_P95_MS` > 200ms for 15m | celeb-api caching + bounded frontend concurrency |
| NFR-02 false merge | < 0.5% | `METRIC_CELEB_FALSE_MERGE_RATE` > 0.005 for 1h | confidence threshold + manual-review routing |
| NFR-03 availability | 99.9% monthly | error budget remaining <25% | stale-safe cached profile fallback |
| NFR-04 maintainability | complexity <=10, coverage >=80 | CI gate failure on threshold breach | per-PR quality gates in both repos |

### Cross-Repo Fan-Out & Dependency Ordering

```yaml
coordination:
  - repo: AliceNN-ucdenver/celeb-api
    fanout_wave: 1
    coordination_role: provider
    depends_on: []
    provides:
      - contract: celeb-profile-v1
        consumed_by:
          - AliceNN-ucdenver/imdb-react-frontend
        readiness: must merge before consumers
    consumes: []
    rationale: Introduces the canonical celebrity profile contract and policy-enforced payload.

  - repo: AliceNN-ucdenver/imdb-react-frontend
    fanout_wave: 2
    coordination_role: consumer
    depends_on:
      - AliceNN-ucdenver/celeb-api
    provides: []
    consumes:
      - contract: celeb-profile-v1
        from: AliceNN-ucdenver/celeb-api
        required_for:
          - FR-04
          - SR-02
    rationale: Renders profile envelope data and fallback states after provider contract is available.
```

## References

- okrs/OKR-2026Q2-IMDB-001-celeb-api/how/prd.md
- okrs/OKR-2026Q2-IMDB-001-celeb-api/why/research-doc.md
- okrs/OKR-2026Q2-IMDB-001-celeb-api/audit/chain-ladder.yaml
- platforms/imdb-lite/bars/imdb-lite-application/security/threat-model.yaml
- https://github.com/AliceNN-ucdenver/celeb-api
- https://github.com/AliceNN-ucdenver/imdb-react-frontend
- skill_call event_id=1,2,3,4,7,8,9,10,11,12,13,14,15,16,17,18 in okrs/OKR-2026Q2-IMDB-001-celeb-api/audit/events/WHAT-2026-05-28-7rr3tt.jsonl

### Self-review — Code-Architect (round 1)
SCORE: 0.92
SEVERITY: PASS
COVERED: [FR-01 schema contract mapped to celeb-api, FR-04 consumer integration mapped to src/pages/MovieDetailPage.tsx, SR-02 policy gating in §5, ADR-003 JWT/RBAC alignment in §4, CALM celeb-api and react-frontend boundary in §1 and coordination YAML]
MISSING: []
CHANGES: []

### Self-review — Code-Security (round 1)
SCORE: 0.90
SEVERITY: PASS
COVERED: [SR-01 with A01/A05 + THR-001, SR-02 with A01/A02 + THR-002, SR-03 with A03/A08 + THR-003, SR-04 with A09/A10 + THR-004, secrets/env management in §6]
MISSING: []
CHANGES: []
