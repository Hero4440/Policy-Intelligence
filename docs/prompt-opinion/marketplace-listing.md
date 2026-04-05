# PolicyPilot Marketplace Listing Draft

## Title

PolicyPilot

## One-paragraph description

PolicyPilot is a prior authorization readiness assistant for specialty drug coverage workflows. It connects live plan-policy lookup with patient-context-aware readiness analysis so a user can ask whether a drug is covered, what prior authorization criteria apply, and what documentation or clinical gaps may still be missing for a selected patient. Responses are grounded in payer policy evidence and framed with cautious clinical language appropriate for healthcare review workflows.

## Capability summary

- Checks whether a drug is covered for a payer or plan
- Returns structured prior authorization criteria with direct policy evidence
- Evaluates patient readiness against policy requirements when SHARP/FHIR context is available
- Uses the Prompt Opinion workspace patient context path instead of custom token plumbing

## Judge instructions

1. Select a demo patient in Prompt Opinion
2. Ask a coverage question such as `Is Humira covered for this patient’s plan?`
3. Ask a criteria question such as `What are the prior authorization requirements for Humira?`
4. Ask a readiness question such as `Is this patient ready for Humira prior authorization submission?`
5. Open the tool trace and confirm the MCP tools were called

## Suggested demo prompts

- `Is Humira covered under this patient’s insurance?`
- `What are the prior authorization criteria for Humira?`
- `Does this patient appear ready for Humira prior authorization submission?`

## Known limitations

- Demo-grade deployment currently runs through ngrok rather than permanent cloud hosting
- Policy dataset is intentionally limited to a small rheumatoid arthritis biologic coverage set for the hackathon scope
- Automated readiness depends on SHARP/FHIR context being enabled in Prompt Opinion
- Synthetic patient scenarios are designed for clear demo outcomes rather than broad clinical coverage

## Discovery keywords

- prior authorization
- drug coverage
- rheumatoid arthritis
- biologics
- FHIR
- SHARP
- MCP
- patient readiness
- payer policy

## Short card copy

Grounded prior authorization coverage and readiness analysis using payer policy evidence plus Prompt Opinion patient context.

## Submission notes

- Publish this only after the MCP connection and PolicyPilot agent are functioning inside Prompt Opinion
- Confirm the listing is visible in Marketplace Studio before treating Phase `05-02` as complete
