# 📋 Deployment Checklist for Hackathon Submission

**Deadline:** May 11, 2026, 11:00 PM ET (2 days away)

---

## Phase 1: Deploy Backend to Railway (THIS STEP - 2-3 hours)

### ✅ Pre-Deployment (10 min)

- [x] Dockerfile created ✓
- [x] railway.json created ✓
- [x] .dockerignore created ✓
- [x] .env.example created ✓
- [x] Deployment guides written ✓
- [x] All files committed to git ✓

### ⬜ Deployment Setup (5-10 min)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub (takes 2 minutes)
   
2. **Connect to GitHub**
   - In Railway dashboard, click "Create new project"
   - Select "Deploy from GitHub"
   - Connect your GitHub account
   - Select `Policy-Intelligence` repository
   - Click "Add Service"

3. **Wait for Auto-Build**
   - Railway detects `Dockerfile` automatically
   - Build starts (takes 3-5 minutes)
   - Watch logs for completion

### ⬜ Configuration (5 min)

While the build runs, go to **Variables** tab and add:

```
GEMINI_KEY_API = (paste from your .env.local)
NODE_ENV = production
PORT = 3000
```

### ⬜ Verification (5 min)

Once deployment shows **"Success"**:

1. **Get Public URL**
   - Go to **Deployments** tab
   - Click latest deployment
   - Copy the **Public URL** (looks like `https://policypilot-xxx.railway.app`)

2. **Test Health Endpoint**
   ```bash
   curl https://policypilot-xxx.railway.app/api/health
   ```
   Should return JSON with status "ok"

3. **Save the URL** for later use in Devpost form

**RESULT:** Your backend is now live at `https://policypilot-xxx.railway.app` ✓

---

## Phase 2: Publish to Prompt Opinion Marketplace (Next Step - 2 hours)

### ⬜ Create Marketplace Listing

1. Go to Prompt Opinion dashboard
2. Create new MCP Server integration
3. Configure:
   - **Name:** PolicyPilot Healthcare Intelligence
   - **Description:** Healthcare AI for policy questions and coverage evaluation
   - **Endpoint:** `https://policypilot-xxx.railway.app/mcp`
   - **Type:** MCP Server
   - **Tools:** Select all 17 tools

4. Publish to marketplace
5. Note the **Marketplace URL** (for Devpost form)

---

## Phase 3: Record Demo Video (Next Step - 1-2 hours)

### ⬜ Prepare Demo Script (30 min)

Record a < 3-minute video showing:

1. **System loads** (5 sec)
   - Open Prompt Opinion
   - Search for PolicyPilot in marketplace
   - Click to integrate

2. **Quick AI demo** (1.5 min)
   - Show `list_policies` tool → returns 2 sample policies
   - Show `ask_policy_question` → ask about bevacizumab coverage
   - Show answer with evidence citations

3. **Patient evaluation** (1 min)
   - Show `extract_patient_facts` on a synthetic patient document
   - Show `evaluate_patient_against_policy` → checklist results

4. **Tools showcase** (30 sec)
   - Quick scroll through all 17 available tools
   - Mention key capabilities (Q&A, coverage lookup, PA criteria, etc.)

### ⬜ Recording (30-45 min)

Use any screen recorder:
- macOS: QuickTime Player (built-in)
- macOS: OBS (free, better)
- Any: ScreenFlow, Camtasia, etc.

**Upload to:**
- YouTube (set to "Unlisted" if not public)
- Or Vimeo
- Copy video link

---

## Phase 4: Devpost Submission (Final Step - 30 min)

### ⬜ Gather Submission Materials

Before submitting, have ready:

```
✓ Project Title
✓ Project Description (150-300 words)
✓ Marketplace URL (from Prompt Opinion)
✓ Video URL (from YouTube/Vimeo)
✓ Public Backend URL (from Railway)
✓ Testing instructions (see below)
```

### ⬜ Test Instructions to Include

Provide clear testing steps for judges:

```
1. Visit Prompt Opinion: https://app.promptopinion.ai
2. Search marketplace for "PolicyPilot"
3. Click "Add to workspace"
4. Test these tools in order:

   a. list_policies
      - Expected: Returns 2 sample policies (BCBS NC, Cigna)
   
   b. ask_policy_question
      - Input: "What are the prior auth requirements for bevacizumab under BCBS NC?"
      - Expected: Answer with evidence citations from the policy
   
   c. evaluate_patient_against_policy
      - Input: A synthetic patient case
      - Expected: Coverage status + checklist of requirements

4. See video for full workflow: [VIDEO_LINK]
```

### ⬜ Fill Devpost Form

Go to [agents-assemble.devpost.com](https://agents-assemble.devpost.com)

1. **Log in** (or create account)
2. **Join hackathon** button
3. **Enter a submission**
4. Fill fields:

   **Project Name:** PolicyPilot: Healthcare Policy Intelligence
   
   **Description:**
   ```
   PolicyPilot is an AI-powered healthcare policy intelligence system 
   that helps clinic staff understand drug coverage, prior authorization 
   requirements, and patient eligibility across multiple payers.
   
   Built as an MCP Server with 17 specialized tools:
   - Natural language Q&A about policies with evidence citations
   - Drug coverage lookup across payers
   - Prior authorization criteria extraction
   - Patient document analysis and fact extraction
   - Coverage evaluation with evidence-backed checklists
   - Policy comparison and change tracking
   
   Uses Google Gemini API for grounded reasoning over synthetic policy 
   documents. All data is de-identified; no real patient information is used.
   
   Deployed on Railway for reliability and auto-scaling.
   ```
   
   **Marketplace URL:** https://prompt-opinion-marketplace.../policypilot
   
   **Video URL:** https://youtube.com/watch?v=...
   
   **Testing Instructions:** [See above section]

5. **Submit** before May 11, 2026, 11:00 PM ET

---

## Timeline Summary

| Phase | Task | Time | Deadline |
|-------|------|------|----------|
| **1** | Deploy to Railway | 2-3 hrs | May 10 |
| **2** | Publish to Marketplace | 2 hrs | May 10 |
| **3** | Record demo video | 1-2 hrs | May 11 (morning) |
| **4** | Fill Devpost form | 30 min | May 11 (11 PM) |
| | **TOTAL** | **5-8 hours** | **May 11, 11 PM** |

---

## Critical URLs to Collect

Once complete, you'll have these URLs. **Save them all:**

```
Backend URL (Railway):
https://policypilot-xxx.railway.app

MCP Endpoint:
https://policypilot-xxx.railway.app/mcp

Health Check:
https://policypilot-xxx.railway.app/api/health

Marketplace URL (Prompt Opinion):
https://[marketplace-url]/policypilot

Demo Video URL:
https://youtube.com/watch?v=...

Devpost Submission:
https://devpost.com/software/policypilot
```

---

## Success Criteria

✅ **Phase 1 Complete When:**
- Backend deployed and responding to `/api/health`
- Public URL obtained from Railway

✅ **Phase 2 Complete When:**
- MCP Server published to Prompt Opinion marketplace
- Marketplace URL available

✅ **Phase 3 Complete When:**
- Video recorded and uploaded (< 3 min)
- Shows integration in Prompt Opinion platform
- Shows 2-3 tools working

✅ **Phase 4 Complete When:**
- Devpost form submitted before 11 PM ET on May 11
- All required fields filled
- Links verified working

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Railway build fails | Check [docs/RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) → Troubleshooting |
| MCP endpoint 500 error | Verify `GEMINI_KEY_API` set in Railway Variables |
| Video too long | Re-record, focus on 2-3 key tools, skip explanations |
| Devpost form missing field | Check submission requirements section (Stage Two criteria) |

---

## Emergency Contacts

**If stuck on deployment:**
1. Check Railway logs: Dashboard → Latest Deployment → Logs tab
2. Check `.env.local` for valid GEMINI_KEY_API
3. Read [RAILWAY_QUICK_START.md](RAILWAY_QUICK_START.md) again carefully

**If deadline approaching:**
- Railway deployment is critical path (do first)
- Video can be simple (just show tools working)
- Description can be straightforward (no marketing fluff needed)

---

## ✨ You've Got This!

You have a genuinely good project. The remaining work is just making it publicly accessible and showing judges what it does. Focus on:

1. ✅ **Deployment first** (most critical)
2. ✅ **Working demo** (judges need to see it work)
3. ✅ **Clear submission** (explain the AI factor clearly)

**Estimated total time: 5-8 hours**  
**Start: Now (May 10-11)**  
**Deadline: May 11, 11:00 PM ET**

Good luck! 🚀
