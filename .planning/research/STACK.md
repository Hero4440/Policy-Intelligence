# Technology Stack

**Project:** PolicyPilot
**Researched:** 2026-04-04

## Recommended Stack

### MCP Server (Core Backend)
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Python | 3.12+ | Runtime | Required by project constraints; excellent healthcare library ecosystem | HIGH |
| mcp[cli] (FastMCP) | 1.x stable | MCP server framework | Official Python SDK from Anthropic. Decorator-based tool registration (`@mcp.tool()`), automatic parameter validation, built-in debugging via MCP Inspector. FastMCP 3.0 (from Prefect) also available but official SDK is simpler for hackathon. | HIGH |
| FastAPI | 0.115+ | HTTP API layer | Only if needed for non-MCP endpoints (health checks, admin). MCP server handles tool transport natively via stdio/SSE/Streamable HTTP. | MEDIUM |
| uvicorn | 0.34+ | ASGI server | Serves FastAPI if used; MCP server has its own transport. | MEDIUM |

### FHIR Patient Context
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| fhir.resources | 7.x+ | FHIR data models | Pydantic V2-powered, built-in validation, supports R4B as sub-package (`fhir.resources.R4B`). Type-safe FHIR resource parsing. | HIGH |
| Synthea | latest | Synthetic patient generation | Industry standard for synthetic FHIR data. Outputs FHIR R4 Bundle transactions, one file per patient with Patient + Conditions + Observations + Procedures. | HIGH |

### Policy Rules Store
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| JSON files | — | Policy data storage | Maximum build speed for 3-5 policies. Schema designed for future migration to SQLite/Postgres. No ORM overhead. | HIGH |
| Pydantic | 2.x | Data validation | Validate policy records on load. Share models between store and MCP tools. Already a dependency via fhir.resources. | HIGH |

### Chat UI
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | 18+ | UI framework | Widely supported, fast to scaffold with Vite | MEDIUM |
| Vite | 5+ | Build tool | Fast dev server, simple config | MEDIUM |
| Tailwind CSS | 3+ | Styling | Rapid UI development, no custom CSS needed | MEDIUM |
| Vercel AI SDK | 4.x | Chat interface | Streaming chat UI components, handles message state, works with any LLM provider | MEDIUM |

**Alternative UI approach (faster):** Use Streamlit or Gradio for Python-only UI. Eliminates React build entirely. Tradeoff: less polished but ships in hours not days.

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Streamlit | 1.40+ | Python-native chat UI | `st.chat_input()` + `st.chat_message()` = working chat in <50 lines. Deploy to Streamlit Cloud free. | HIGH |
| Gradio | 5.x | Alternative Python UI | `gr.ChatInterface()` for instant chat. Deploy to HuggingFace Spaces free. | HIGH |

### LLM Integration
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| anthropic | 0.40+ | Claude API client | Native tool_use support, direct MCP tool calling | HIGH |
| claude-sonnet-4-5-20250929 | — | LLM model | Best cost/quality ratio for tool use; fast enough for demo | HIGH |

### Deployment
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Railway / Render | — | Backend hosting | Free tier, deploy from Git, supports Python. Railway has one-click deploy. | MEDIUM |
| Streamlit Cloud | — | UI hosting (if Streamlit) | Free for public repos, zero config | HIGH |
| Vercel | — | UI hosting (if React) | Free tier, deploy from Git | HIGH |

### PDF Extraction (Offline)
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PyMuPDF (fitz) | 1.24+ | PDF text extraction | Fast, accurate, handles complex layouts better than pdfplumber for policy docs | MEDIUM |
| Claude API | — | Structured extraction | Send PDF text to Claude, extract structured fields. Most accurate for complex policy language. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| MCP SDK | mcp[cli] (official) | FastMCP 3.0 (Prefect) | Official SDK is simpler, fewer dependencies, better documented for basic tool servers |
| FHIR | fhir.resources | fhirclient (SMART) | fhirclient targets SMART-on-FHIR server connections; fhir.resources is better for local bundle parsing |
| Policy store | JSON | SQLite | JSON is faster to build; 3-5 policies don't need query optimization |
| UI | Streamlit | React + Vite | React adds a full frontend build step; Streamlit ships a working chat in hours |
| PDF extraction | Claude API | LangChain document loaders | LangChain adds heavy dependency for something Claude does natively |
| Deployment | Railway | Docker + AWS | AWS is overkill for hackathon; Railway deploys in minutes |

## What NOT to Use

- **LangChain** — Heavy framework, unnecessary abstraction for 3 MCP tools
- **Vector databases (Pinecone, Chroma)** — Not needed; structured JSON lookup, not semantic search
- **Django/Flask** — Overkill for MCP server; FastMCP handles everything
- **Docker** — Adds deployment complexity; Railway/Render handle Python natively
- **Terraform/IaC** — Hackathon, not production infrastructure

## Installation

```bash
# Core MCP server
pip install "mcp[cli]" anthropic pydantic

# FHIR
pip install fhir.resources

# PDF extraction (offline use)
pip install PyMuPDF

# UI (Option A: Streamlit — recommended for speed)
pip install streamlit

# UI (Option B: React — if you want polished frontend)
npm create vite@latest ui -- --template react-ts
cd ui && npm install
```

## Sources

- [MCP Python SDK (Official)](https://github.com/modelcontextprotocol/python-sdk)
- [FastMCP Tutorial](https://www.firecrawl.dev/blog/fastmcp-tutorial-building-mcp-servers-python)
- [fhir.resources on PyPI](https://pypi.org/project/fhir.resources/)
- [Synthea Overview](https://mitre.github.io/fhir-for-research/modules/synthea-overview)
- [MCP 2026 Guide](https://dev.to/universe7creator/the-complete-guide-to-model-context-protocol-mcp-building-ai-native-applications-in-2026-10c5)
