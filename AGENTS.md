# GrowthMantra AI Engineering Rules

1. Read product and architecture docs before implementing.
2. Never expose secrets in code, browser bundles, logs or documentation.
3. Every tenant-owned resource must be tenant-scoped and authorized server-side.
4. Branch access is enforced independently from tenant access.
5. Never trust tenant_id, branch_id, role or ownership supplied by client.
6. AI drafts; external publishing and non-routine communication require approval.
7. Editing content after approval invalidates prior approval.
8. Re-check approval, consent, opt-out and provider policy before sending.
9. Use official provider APIs only.
10. External side effects must be idempotent and audited without secrets.
11. Never invent preschool facts, analytics, integration status or API success.
12. Add tests for every permission boundary and critical state transition.
13. Use migrations; do not manually mutate production schema.
14. Preserve working code; avoid broad rewrites.
15. Do not mark a task complete until checks pass.
16. Document assumptions and provider-access dependencies.
