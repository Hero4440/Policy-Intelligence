# Railway Deployment Guide

This guide walks you through deploying PolicyPilot backend to Railway in 10 minutes.

## Prerequisites

- Railway account (free tier available at [railway.app](https://railway.app))
- GitHub repository connected to Railway (recommended) or use Railway CLI
- Google Gemini API key (from `.env.local`)

## Quick Start (GitHub Connected)

### 1. Connect Repository to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Connect your GitHub account (if not already connected)
5. Select this repository: `Policy-Intelligence`
6. Railway will auto-detect the `Dockerfile` and deploy

### 2. Configure Environment Variables

Once the project is created:

1. Go to **Settings** → **Variables**
2. Add these variables:

```
GEMINI_KEY_API=<your_key_from_.env.local>
NODE_ENV=production
PORT=3000
```

3. Click **Deploy**

**Deployment time:** 3-5 minutes

### 3. Get Your Public URL

Once deployed:
1. Go to **Deployments** tab
2. Find the latest successful deployment
3. Click on it to see the **Public URL**
4. Your backend is live at: `https://<your-app>.railway.app`

**Example URLs:**
- Health check: `https://<your-app>.railway.app/api/health`
- MCP endpoint: `https://<your-app>.railway.app/mcp`

---

## Using Railway CLI (Alternative)

If you prefer CLI-based deployment:

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login & Link Project

```bash
railway login
railway link  # Follow prompts to create/select project
```

### 3. Deploy

```bash
railway up
```

This will:
- Build the Docker image
- Push to Railway
- Deploy automatically
- Show you the public URL

### 4. Set Environment Variables

```bash
railway variables set GEMINI_KEY_API=<your_key>
railway variables set NODE_ENV=production
```

### 5. Redeploy

```bash
railway up
```

---

## Verification Checklist

After deployment, verify everything works:

### ✅ Health Check
```bash
curl https://<your-app>.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "policypilot-chat",
  "timestamp": "2026-05-11T...",
  "storage": {
    "policiesLoaded": 2,
    "payers": ["BCBS NC", "Cigna"],
    "payerCount": 2,
    "patientCases": 5,
    "evaluations": 3
  }
}
```

### ✅ MCP Health
```bash
curl https://<your-app>.railway.app/mcp
```

Expected: Should accept MCP protocol requests

### ✅ Test a Tool
```bash
curl -X POST https://<your-app>.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{...mcp_request...}'
```

---

## File Persistence

Railway uses **ephemeral filesystems by default**, meaning data stored in `/app/data` will be lost on redeploy.

### Solution: Railway Volume

To persist policy and patient data across deployments:

1. Go to **Settings** → **Volumes**
2. Click **Add Volume**
3. Configure:
   - **Mount Path:** `/app/data`
   - **Volume Size:** 1 GB (default)
4. Click **Add**
5. Redeploy

Now data persists automatically.

---

## Troubleshooting

### Deployment Fails - "Dockerfile not found"

Ensure `Dockerfile` is in the repository root:
```bash
ls -la Dockerfile
```

If missing, check [Dockerfile](../../Dockerfile) was created correctly.

### Deployment Fails - "Build timeout"

The Node.js build can take 5-10 minutes. If it times out:
1. Check memory allocation (Railway dashboard → Resources)
2. Increase build timeout in `railway.json`
3. Or use Railway CLI: `railway up --verbose`

### Server crashes on startup - "Port in use"

Railway automatically assigns `PORT` via environment variable. The Dockerfile respects this.
If you see "port 3000 in use" error:
1. Verify PORT environment variable is set in Railway dashboard
2. Check for port conflicts by reviewing logs

### API returns 401/403 on Gemini calls

Your `GEMINI_KEY_API` is invalid or missing:
1. Verify the key in Railway Variables dashboard
2. Test locally: `npm run server:dev` with correct `.env.local`
3. Re-check the key value (no trailing spaces/newlines)

### Data not persisting after redeploy

Confirm volume is mounted:
1. Go to **Settings** → **Volumes**
2. Verify `/app/data` mount exists
3. If missing, add it (see "File Persistence" above)

---

## Monitoring & Logs

### View Logs

1. Go to **Deployments** → Latest deployment
2. Click **Logs** tab
3. See real-time server output

### Important Logs to Check

```
PolicyPilot server listening on port 3000      # ✅ Server started
API health: http://localhost:3000/api/health   # ✅ APIs ready
Error: GEMINI_KEY_API not set                  # ❌ Missing config
Error: ENOENT: no such file ...data/policies   # ❌ Volume not mounted
```

### Memory/CPU Usage

1. Go to **Settings** → **Resources**
2. Check **CPU** and **Memory** graphs
3. If consistently high, increase resource allocation

---

## Updating Deployment

After pushing changes to GitHub:

### If using GitHub Deploy:
- Railway auto-detects changes
- Automatically rebuilds and deploys
- No action needed

### If using Railway CLI:
```bash
git push origin main
railway up
```

---

## Cost Considerations

**Free Tier:**
- First **$5/month** credit (enough for hobby projects)
- 512 MB memory included
- No credit card required

**Typical Monthly Cost** (for PolicyPilot):
- Server: ~$5 (512 MB, low traffic)
- Storage: ~$2 (1 GB volume)
- **Total: ~$7-10/month**

Monitor usage at: Railway dashboard → **Billing**

---

## Production Checklist

Before submitting to the hackathon:

- [ ] Dockerfile builds successfully locally: `docker build -t policypilot .`
- [ ] Environment variables configured in Railway dashboard
- [ ] Health check passes: `/api/health` returns 200
- [ ] MCP endpoint responds: `/mcp` accepts POST requests
- [ ] Volume mounted for data persistence (if needed)
- [ ] Public URL documented
- [ ] Logs show no errors on startup
- [ ] Test one API call from frontend (if deployed)

---

## Support

For Railway-specific issues:
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

For PolicyPilot issues:
- Check logs in Railway dashboard
- Run locally: `npm run server:dev`
- Review `.env.example` for required variables

---

**Public URL Template for Hackathon Submission:**
```
https://<your-railway-app>.railway.app
```

**MCP Endpoint (for Prompt Opinion integration):**
```
https://<your-railway-app>.railway.app/mcp
```

**Example (if your app is named "policypilot-prod"):**
```
https://policypilot-prod.railway.app
https://policypilot-prod.railway.app/mcp
```
