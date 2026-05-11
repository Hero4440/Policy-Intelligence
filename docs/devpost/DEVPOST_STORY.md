# PolicyPilot: Making Healthcare Coverage Decisions Human Again

## The Problem (It's More Common Than You Think)

Imagine you're a healthcare provider and a patient walks in asking, "Will my insurance cover this drug?" You don't have a quick answer. You might spend 15 minutes on hold with the insurance company, or you dig through a PDF formulary that hasn't been updated in three months. Meanwhile, the patient is sitting in the exam room, your schedule is backing up, and you're stressed.

Now multiply that by dozens of patients per day across multiple insurance plans. This isn't just inconvenient—it delays patient care and leads to frustration on both sides.

The real problem? **Healthcare coverage information exists, but it's fragmented, outdated, and nearly impossible to access when you need it most.** Payers maintain their own systems, policies change constantly, and there's no single source of truth. Healthcare providers are left playing detective with incomplete information.

## The Inspiration

We built PolicyPilot after realizing that this frustration is felt by thousands of healthcare organizations every single day. There's no shortage of policy data, but there's a massive shortage of *usable* policy data. We knew we could solve this.

## What We Built

**PolicyPilot** is a policy intelligence platform that turns fragmented insurance data into actionable insights:

### Core Features
- **Unified Drug Coverage Search**: Look up coverage for any drug across multiple payers in seconds
- **Cross-Payer Comparison**: See side-by-side which plans cover what, with clear visual indicators
- **Real-Time Policy Tracking**: Monitor when policies change and understand what changed and why
- **AI-Powered Chat**: Ask natural language questions about coverage, prior auth requirements, and patient eligibility
- **Evidence Explorer**: Search through actual policy documents to verify coverage details

The interface is designed to be used *during* patient conversations—clean, fast, and focused on what matters.

## How We Built It

We started with three core challenges:

1. **Data Integration**: Policies come from multiple sources in multiple formats. We built a normalized data pipeline that ingests formularies and policy documents, extracts key information, and keeps everything synchronized.

2. **Intelligent Search**: Keyword search isn't enough when you're looking for "coverage for diabetes medications." We integrated AI-powered semantic search so providers can ask natural questions and get precise answers about coverage, prior authorization criteria, and policy requirements.

3. **Real-Time Updates**: Insurance policies change constantly. Our system tracks changes over time, highlights what's new, and maintains a history of policy updates so organizations never miss critical changes.

### Tech Stack
- **Frontend**: React + TypeScript with a thoughtfully designed UI (cream theme for reduced eye strain during long work days)
- **Backend**: Node.js server with AI integration via Claude for intelligent policy queries
- **Data**: Normalized policy databases with version tracking
- **Accessibility**: Built with WCAG AA compliance and keyboard navigation from day one

## The Challenges

**Challenge 1: Data Standardization**  
Insurance policies are written in completely different ways. One payer might call something "Prior Authorization Required" while another says "Requires Approval." We had to build intelligent parsing and normalization to make these comparable.

**Challenge 2: Keeping Data Current**  
Policies change monthly, sometimes weekly. We implemented a change-tracking system that flags when coverage changes, helping organizations stay compliant and informed.

**Challenge 3: Making Complex Information Accessible**  
A prior authorization requirement involves multiple criteria: patient history, medication history, failed treatments, etc. We used AI to make this conversational—providers can ask "Does this patient qualify?" and get a clear yes or no with reasoning.

## What We Learned

1. **Healthcare providers don't need more data—they need *less* noise and more signal.** Showing everything isn't helpful; highlighting what matters is.

2. **Speed matters in healthcare.** If a lookup takes 30 seconds instead of 2 minutes, that compounds across 50 patients a day. We obsessed over response times.

3. **Trust requires transparency.** When an AI system tells you a patient qualifies for a drug, you need to see the evidence. We made every answer traceable back to the source policy.

## Why This Matters

Healthcare providers spend an estimated **1-2 hours per day** on coverage-related questions. That's 200-400 hours per year per organization, taken away from patient care. In a hospital with 100 providers, that's the equivalent of a full-time employee doing nothing but answering coverage questions.

PolicyPilot reclaims that time. More importantly, it reduces errors, ensures coverage decisions are based on current information, and lets providers focus on what they do best: caring for patients.

## What's Next

We're focused on three things:
1. Expanding to more payers (currently 10+, expanding to 50+)
2. Integrating with major EHR systems so coverage checks happen automatically
3. Adding predictive insights to help organizations anticipate coverage denials

---

**The bottom line**: Healthcare organizations shouldn't have to be insurance experts to answer basic coverage questions. PolicyPilot makes policy intelligence actionable, accessible, and impossible to ignore.
