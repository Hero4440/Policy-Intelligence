# Insurance Hackathon Final Data Package

Use these three files in your app:
- plans.csv
- formulary_drugs_by_plan.csv
- coverage_rules_by_plan.csv

Supporting files:
- plan_formulary_map.csv
- query_ready_formulary.csv
- llm_ready_plan_records.jsonl

Notes:
- Ambetter and UHC are from uploaded 2026 Arizona formulary/PDL files.
- BCBS AZ is from an uploaded 2023 exchange formulary used as a 2026 demo proxy.
- Plan-drug rows were expanded across plans that share the same formulary group.
- Oscar plan rows may exist in plans.csv, but Oscar plan-drug rows are not present until an Oscar formulary is parsed.