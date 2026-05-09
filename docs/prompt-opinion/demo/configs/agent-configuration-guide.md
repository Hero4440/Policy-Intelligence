# Agent Configuration Guides for Prompt Opinion

Specialized prior authorization demo agent configurations are split into three focused guides:

1. [Doctor Agent Configuration](./doctor-agent-configuration-guide.md)
2. [Patient Agent Configuration](./patient-agent-configuration-guide.md)
3. [Prior Auth Agent Configuration](./prior-auth-agent-configuration-guide.md)

All agents use the **PolicyPilot MCP Server** for data-backed responses only.

## Demo Flow with These Configs

```
User: "Check bevacizumab coverage for Robert Anderson"

1. Connector routes to Doctor Agent
2. Doctor Agent:
   - Calls: get_drug_coverage(bevacizumab, BCBS, metastatic colorectal cancer, age=53)
   - Returns: JSON with coverage_status, prior_auth_criteria, data_sources
3. User asks: "Is he approved?"
4. Connector routes to Prior Auth Agent
5. Prior Auth Agent:
   - Calls: evaluate_patient_against_policy(robert_anderson, bcbs_nc, bevacizumab)
   - Returns: JSON with coverage_decision, criteria_evaluation, missing_documentation
6. User asks: "What do I tell the patient?"
7. Connector routes to Patient Agent
8. Patient Agent:
   - Takes Prior Auth decision + Doctor findings
   - Calls: generate_next_steps(eval_id)
   - Returns: JSON with patient_friendly_summary, next_steps, timeline, sources
```

All answers are data-backed from PolicyPilot MCP. No hallucinations.
