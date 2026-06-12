# Agent Governance Instructions

This repository is governed by **The Red Queen** governance system.

## BAR: IMDB Celebs (APP-IMDB-002)

- **Governance Tier:** restricted
- **Composite Score:** 67/100
- **Criticality:** medium
- **Permission Mode:** plan
- **Threat Model Access:** restricted

## Permissions (Restricted Tier)

**Plan first, implement only after approval.** This BAR has governance
gaps that must be addressed. Before implementing:
1. Call `governance_gaps` and review all findings
2. Create a remediation plan
3. Get human approval before proceeding

**Allowed tools:** Read, Glob, Grep
**Denied tools:** Bash, Write

## Active Constraints

### security Constraints
The security pillar score (0/100) is below the governance threshold (60).
- Apply prompt packs: owasp-top-10, secure-coding
- All changes must pass security review

## Cross-BAR Dependencies

- **IMDB Lite Application** (bar-to-bar)
- **IMDB Identity Service** (bar-to-infrastructure)
- **Image CDN** (bar-to-infrastructure)

## Before Making Changes

1. Call `get_orchestration_decision` to understand your full governance context.
2. Call `get_constraints` to understand your permission tier and boundaries.
3. Call `get_bar_context` to understand the application's architecture,
   governance scores, and active constraints.
4. Call `governance_gaps` to check for existing governance issues.
5. For any structural change (new service, database connection,
   external call), call `validate_action` to verify governance compliance.

## Required Validations

- All proposed structural changes: `validate_action`
- Architecture file validation: `validate_calm`
- Before creating a PR: `governance_gaps()` to check for issues
- Review ADRs with `get_adrs` before making architectural decisions

## Governance Tiers

| Tier | Min Score | Mode | Agents | Human Approval |
|------|----------|------|--------|----------------|
| autonomous | 80% | auto-edit | 1 | No |
| supervised | 50% | ask-edit | 1 | Yes |
| restricted | 0% | plan | 2 | Yes |
