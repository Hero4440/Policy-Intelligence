# 🚀 Railway Deployment - 10 Minute Quick Start

Get your PolicyPilot backend live on Railway in under 10 minutes.

## What You'll Get

✅ Public URL: `https://policypilot-xxx.railway.app`  
✅ MCP endpoint: `https://policypilot-xxx.railway.app/mcp`  
✅ Auto-scaling, monitoring, logs included  
✅ Free tier covers hobby usage (~$5/month credit)

---

## Step 1: Prerequisites (2 min)

### A. Create Railway Account (if needed)
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (easiest)
3. Come back here

### B. Get Your Gemini API Key
From `.env.local` in this project:
```bash
cat .env.local | grep GEMINI_KEY_API
```
Copy the key value (it looks like `AQ.Ab8RN6J...`)

---

## Step 2: Deploy via GitHub (6 min) — EASIEST

### Option A: Railway Dashboard (Recommended for First Time)

1. **Go to Railway**: https://railway.app/dashboard
2. **Create new project**:
   - Click **"Create a new project"** button
   - Select **"Deploy from GitHub"**
   - Connect GitHub account (if needed)
   - Select **`Policy-Intelligence`** repository
   - Click **"Add Service"**

3. **Wait for auto-detection**:
   - Railway automatically detects the `Dockerfile`
   - It starts building (takes 3-5 minutes)
   - You'll see a log window with build output

4. **Add environment variables** (while building):
   - Go to **Variables** tab
   - Click **"Add Variable"**
   - Add:
     ```
     GEMINI_KEY_API = (paste your key)
     NODE_ENV = production
     PORT = 3000
     ```
   - Click **"Add"**

5. **Check deployment**:
   - When build completes, status changes to **"Deployed"**
   - Click on **"Deployments"** tab
   - Find your latest deployment
   - Click it to see **Public URL**

**Your URL looks like:** `https://policypilot-xxx.railway.app`

---

## Step 3: Verify Deployment (1-2 min)

### Test Health Endpoint
```bash
curl https://policypilot-xxx.railway.app/api/health
```

Expected response (should see 200 OK):
```json
{
  "status": "ok",
  "service": "policypilot-chat",
  "storage": {
    "policiesLoaded": 2,
    "payerCount": 2,
    "patientCases": 5,
    "evaluations": 3
  }
}
```

### Test MCP Endpoint
```bash
curl https://policypilot-xxx.railway.app/mcp -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

If you get a response (even an error), the MCP endpoint is working ✓

---

## Step 4: Configure Data Persistence (Optional but Recommended)

Without this step, your policy data resets on each redeploy.

1. Go to **Settings** tab
2. Scroll to **"Volumes"**
3. Click **"Add Volume"**
4. Configure:
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB (default is fine)
5. Click **"Create"**
6. Go back to **Deployments** and click **"Redeploy"**

Now your data persists across deployments ✓

---

## Step 5: Use in Hackathon Submission

Your public URL:
```
https://policypilot-xxx.railway.app
```

For Prompt Opinion integration:
```
https://policypilot-xxx.railway.app/mcp
```

---

## Troubleshooting

### "Build failing" / "Error in logs"

1. Check the actual error in **Logs** tab
2. Most common issues:

   **Missing environment variable:**
   - Go to **Variables** tab
   - Verify `GEMINI_KEY_API` is set (not empty)
   - If empty, paste your actual key
   - Redeploy

   **Missing Dockerfile:**
   - Make sure `Dockerfile` is at project root
   - It was created by our deployment setup
   - If missing, check git status: `git status | grep Dockerfile`

3. Still stuck? Share the **Logs** tab output

### "Health endpoint returns 500"

1. Check **Logs** tab for startup errors
2. Verify `GEMINI_KEY_API` is correct and not empty
3. Try redeploying: **Deployments** → **Redeploy**

### "Data not persisting"

1. Go to **Settings** → **Volumes**
2. Verify `/app/data` mount exists
3. If missing, follow "Step 4" above
4. Redeploy

---

## Alternative: Deploy via Railway CLI (Faster if Repeating)

If you have [Railway CLI](https://docs.railway.app/guides/cli) installed:

```bash
# 1. Login
railway login

# 2. Link to this project (first time only)
railway link

# 3. Deploy
railway up

# 4. Set environment variables
railway variables set GEMINI_KEY_API="your_key"
railway variables set NODE_ENV=production

# 5. Check status
railway status
railway logs
```

---

## Monitoring

After deployment, you can monitor:

1. **Logs**: Deployments tab → Logs (see real-time output)
2. **Resources**: Settings tab → Resources (CPU/memory usage)
3. **Deployments**: Track all past deployments and rollback if needed
4. **Metrics**: See traffic, response times, errors

---

## Cost

**Free Tier**: $5/month credit (covers small hobby projects)  
**Typical cost**: $7-10/month for PolicyPilot (512MB memory, 1GB storage)

Monitor at: Railway dashboard → **Billing**

---

## Next Steps for Hackathon

1. ✅ Backend deployed to Railway (this document)
2. ⬜ Publish to Prompt Opinion Marketplace
3. ⬜ Record demo video (< 3 min)
4. ⬜ Submit to Devpost

---

## Need Help?

**For Railway issues:**
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

**For PolicyPilot issues:**
- Check logs in Railway dashboard
- Email: the.whitfield.222@gmail.com

---

**Total time to live: ~10 minutes** ⏱️
