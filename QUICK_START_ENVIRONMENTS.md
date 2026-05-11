# Quick Start: Running Locally, Vercel & Railway

## 🚀 Local Development (Right Now)

```bash
# 1. Copy env template
cp .env.example .env.local

# 2. Add your Gemini API key to .env.local
# GEMINI_KEY_API=your_key_here

# 3. Run server
npm run server:dev

# 4. Open browser
http://localhost:3000
```

## 📤 Deploy to Vercel

```bash
# Push to main branch
git push origin main
```

Then set environment variables in **Vercel Dashboard**:
- Go to Project **Settings > Environment Variables**
- Add: `GEMINI_KEY_API=your_key_here`
- Redeploy

## 🚂 Deploy to Railway

```bash
# Push to main branch
git push origin main
```

Then set environment variables in **Railway Dashboard**:
- Go to Project **Settings > Variables**
- Add: `GEMINI_KEY_API=your_key_here`
- Save and auto-redeploys

---

## Key Points

| Environment | Where are env vars? | How to add them? |
|------------|-------------------|------------------|
| **Local** | `.env.local` (gitignored) | Edit the file locally |
| **Vercel** | Vercel Dashboard | Settings > Environment Variables |
| **Railway** | Railway Dashboard | Settings > Variables |

✅ **The app auto-detects its environment and loads vars accordingly**

See `ENVIRONMENT_SETUP.md` for complete details.
