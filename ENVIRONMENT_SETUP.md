# Multi-Environment Setup Guide

This guide explains how to run the PolicyPilot application locally and in production environments (Vercel, Railway).

## Architecture

The app automatically detects its environment and loads configuration accordingly:

- **Local Development** (`npm run server:dev`): Loads from `.env.local`
- **Vercel Production**: Uses environment variables set in Vercel dashboard
- **Railway Production**: Uses environment variables set in Railway dashboard
- **Docker/Any Server**: Uses environment variables set in the container runtime

## Local Development Setup

### 1. Create `.env.local` file

Copy the example and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# Google Gemini API Configuration
GEMINI_KEY_API=your_actual_api_key_here
GEMINI_VERTEX_PROJECT_ID=policy-intelligence-493802
GEMINI_VERTEX_LOCATION=us-central1

# Server Configuration
NODE_ENV=development
PORT=3000
```

### 2. Run locally

```bash
npm run server:dev
```

This starts the server with hot-reload on `http://localhost:3000`.

**Note:** `.env.local` is gitignored and will never be committed to the repository.

---

## Vercel Production Setup

### 1. Connect your repository

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the project

### 2. Set environment variables

1. Go to project **Settings > Environment Variables**
2. Add the following variables:

```
GEMINI_KEY_API=your_actual_api_key_here
GEMINI_VERTEX_PROJECT_ID=policy-intelligence-493802
GEMINI_VERTEX_LOCATION=us-central1
NODE_ENV=production
```

3. Make sure they're set for **Production** environment
4. Save and redeploy

### 3. Configure build settings (if needed)

- **Build Command:** `npm run frontend:build` (Vercel auto-detects server)
- **Output Directory:** `dist`
- **Node.js Version:** 20.x

### 4. Deploy

Push to your main branch:

```bash
git push origin main
```

Vercel automatically deploys on every push.

---

## Railway Production Setup

### 1. Create a Railway account and project

1. Go to [Railway Dashboard](https://railway.app)
2. Create a new project
3. Add your GitHub repository

### 2. Set environment variables

1. Go to your project **Settings > Variables**
2. Add the following variables:

```
GEMINI_KEY_API=your_actual_api_key_here
GEMINI_VERTEX_PROJECT_ID=policy-intelligence-493802
GEMINI_VERTEX_LOCATION=us-central1
NODE_ENV=production
PORT=3000
```

3. Save

### 3. Configure the service

1. Railway auto-detects your app, but verify:
   - **Start Command:** `node --import tsx/esm src/server/index.ts`
   - **Build Command:** `npm ci && npm run frontend:build`
   - **Dockerfile:** Uses the provided `Dockerfile` automatically if no build command works

2. Check **Deployments** to verify it starts correctly

### 4. Deploy

Push to your main branch:

```bash
git push origin main
```

Railway automatically triggers a deployment.

---

## Docker/Self-Hosted Setup

### Run with Docker

```bash
# Build
docker build -t policypilot .

# Run with environment variables
docker run -p 3000:3000 \
  -e GEMINI_KEY_API=your_api_key \
  -e GEMINI_VERTEX_PROJECT_ID=policy-intelligence-493802 \
  -e GEMINI_VERTEX_LOCATION=us-central1 \
  -e NODE_ENV=production \
  policypilot
```

The `Dockerfile` automatically:
- Installs dependencies
- Builds the frontend
- Copies data files
- Starts the server on port 3000

---

## Environment Variables Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `GEMINI_KEY_API` | Yes | - | Google Gemini API key for AI responses |
| `GEMINI_VERTEX_PROJECT_ID` | Optional | policy-intelligence-493802 | Google Cloud project ID |
| `GEMINI_VERTEX_LOCATION` | Optional | us-central1 | Google Cloud location |
| `GEMINI_MODEL` | Optional | gemini-2.5-flash | Override default model |
| `NODE_ENV` | Optional | development | Set to `production` for prod environments |
| `PORT` | Optional | 3000 | Server port |

---

## Troubleshooting

### "GEMINI_KEY_API environment variable is not set"

**Local:** Add `GEMINI_KEY_API=your_key` to `.env.local`

**Vercel/Railway:** Add the variable in the platform's environment settings and redeploy

### API requests return 403 "blocked" error

The API key is restricted. Fix in Google Cloud Console:
1. Go to **APIs & Services > Credentials**
2. Select your API key
3. Check **API restrictions** → ensure "Generative Language API" is selected
4. Check **Application restrictions** → adjust if IP-restricted

### Port 3000 already in use locally

Change the port:
```bash
PORT=3001 npm run server:dev
```

### Changes not reflecting after git push

**Vercel/Railway:** Wait 1-2 minutes for deployment to complete. Check the deployment logs.

**Docker:** Rebuild the image: `docker build -t policypilot .`

---

## Development Workflow

1. **Make changes locally** with `npm run server:dev`
2. **Test locally** at `http://localhost:3000`
3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```
4. **Vercel/Railway auto-deploys** within 1-2 minutes
5. **Monitor** in Vercel/Railway dashboards

---

## Important Notes

- `.env.local` is **gitignored** — it only exists on your machine
- Never commit `.env.local` or `.env` files to git
- Production API keys are set in platform dashboards, not in code
- The app automatically detects its environment based on `NODE_ENV`
- In production, the app will gracefully fall back if Gemini API is unavailable (using local policy data)

