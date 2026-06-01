
### PolicyPilot

Making healthcare coverage decisions human again.

PolicyPilot is a policy intelligence platform that helps healthcare providers quickly understand insurance coverage, prior authorization requirements, formulary rules, and policy changes across multiple payers.

Instead of digging through outdated PDFs, calling insurance companies, or manually comparing plan documents, providers can search, compare, and verify coverage decisions in seconds.

⸻

Problem

Healthcare coverage information is scattered across payer portals, PDF formularies, policy documents, and internal systems. These sources are often difficult to search, inconsistent in terminology, and frequently outdated.

For providers, this creates a frustrating workflow:

* Spend 15+ minutes checking whether a drug is covered
* Search through long PDF formularies manually
* Call insurance companies for basic policy clarification
* Delay patient care while waiting for coverage answers
* Repeat the same process across dozens of patients and plans

The result is wasted time, provider frustration, delayed treatment, and inconsistent coverage decisions.

⸻

What PolicyPilot Does

PolicyPilot turns fragmented insurance policy data into clear, searchable, and actionable insights.

Core Features

Unified Drug Coverage Search

Search for any drug across multiple payers and quickly see whether it is covered.

Cross-Payer Comparison

Compare coverage across plans side by side with clear visual indicators.

Real-Time Policy Tracking

Track policy updates, identify what changed, and understand why it matters.

AI-Powered Chat

Ask natural language questions about:

* Drug coverage
* Prior authorization requirements
* Step therapy criteria
* Patient eligibility
* Policy exceptions

Evidence Explorer

Search through source policy documents and verify AI-generated answers against the original evidence.

Transparent AI Responses

Every AI answer is traceable back to the underlying policy document, helping providers trust and verify the result.

⸻

Why It Matters

Healthcare providers often spend 1–2 hours per day answering coverage-related questions. Across a large organization, this can add up to hundreds of hours every year.

PolicyPilot helps reclaim that time by making coverage information easier to access, compare, and verify.

With PolicyPilot, providers can:

* Reduce time spent on coverage lookups
* Make faster treatment decisions
* Avoid outdated policy information
* Improve prior authorization workflows
* Reduce administrative burden
* Focus more time on patient care

⸻

How It Works

PolicyPilot is built around three main capabilities:

1. Data Integration

Insurance policies and formularies come from different sources and formats. PolicyPilot normalizes this data into a structured format so that coverage rules can be searched and compared consistently.

The pipeline supports:

* Formulary ingestion
* Policy document parsing
* PDF extraction
* OCR-based text extraction
* Structured schema generation
* Versioned policy storage

2. Intelligent Search

Traditional keyword search is not enough for healthcare policy questions.

PolicyPilot uses semantic search and LLM-powered reasoning so providers can ask questions like:

“Is this diabetes medication covered for this patient?”

or

“What are the prior authorization requirements for this drug?”

The system retrieves relevant policy evidence and generates a clear answer with supporting reasoning.

3. Change Tracking

Insurance policies change frequently. PolicyPilot tracks policy versions over time and highlights meaningful changes, such as:

* Coverage status changes
* New prior authorization requirements
* Updated step therapy rules
* Removed or added drugs
* Changes in payer policy language

⸻

Tech Stack

Frontend

* React
* TypeScript
* Tailwind CSS
* Flow and graph visualization
* Accessible UI with keyboard navigation
* WCAG AA-focused design

Backend

* Python
* FastAPI
* Node.js server layer
* Rule-based decision engine
* LLM-powered policy query workflows
* MCP-style agent workflows

Data and AI

* PostgreSQL
* Vector search
* JSON schema design
* PDF parsing
* OCR
* Policy normalization pipeline
* OpenAI/Gemini-style LLM workflows

Infrastructure

* Docker
* Vercel deployment

⸻

Key Challenges

Data Standardization

Insurance payers use different terminology for the same concept. For example, one payer may say “Prior Authorization Required,” while another may say “Requires Approval.”

PolicyPilot normalizes these variations into consistent fields that can be compared across payers.

Keeping Data Current

Coverage policies can change monthly or even weekly. PolicyPilot includes version tracking and change detection to help organizations stay informed when important updates happen.

Making Complex Rules Understandable

Prior authorization decisions often depend on multiple criteria, such as patient history, previous treatments, diagnosis, medication history, and payer-specific requirements.

PolicyPilot uses AI to make these rules easier to understand through conversational questions and evidence-backed answers.

⸻

What We Learned

Building PolicyPilot taught us that healthcare providers do not need more raw data. They need cleaner, faster, and more trustworthy answers.

Three lessons shaped the product:

1. Speed matters. A coverage lookup should take seconds, not minutes.
2. Less noise is better. Providers need the most relevant information, not every policy detail at once.
3. Trust requires transparency. AI-generated answers must be backed by source policy evidence.

⸻

Roadmap

Next, we plan to focus on:

* Expanding payer coverage from 10+ payers to 50+ payers
* Integrating with major EHR systems
* Automating coverage checks inside clinical workflows
* Adding predictive insights for likely coverage denials
* Improving policy change alerts and compliance tracking

⸻

Built With

* Docker
* FastAPI
* Python
* React
* TypeScript
* Tailwind CSS
* PostgreSQL
* Vector Search
* PDF Parsing
* OCR
* JSON Schema Design
* Rule-Based Decision Engine
* Graph / Flow Visualization
* MCP-style Agent Workflows
* OpenAI / Gemini-style LLM Workflows

⸻

Links

* Live Demo: policy-intelligence-peach.vercel.app
* Project Page: app.promptopinion.ai
* GitHub Repo: Add repository link here
