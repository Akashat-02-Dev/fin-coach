# FinCoach Production Deployment Guide

This guide outlines the steps to push your local workspace to a GitHub repository and deploy the full-stack application (PostgreSQL database, Express API server, and React/Vite frontend) online using completely free, stable, and hassle-free cloud platforms.

---

## 1. Pushing to a GitHub Repository

We have already committed all your code modifications and new components locally. To upload this to your GitHub account:

### Step 1: Create a Repository on GitHub
1. Go to [GitHub](https://github.com/) and log in.
2. Click the **New** button to create a new repository.
3. Name it (e.g., `financial-coach`) and keep it **Public** or **Private** as desired.
4. Do **not** initialize it with a README, `.gitignore`, or license (since we already have them locally).
5. Click **Create repository**.

### Step 2: Link and Push from your Terminal
Run the following commands in your local workspace terminal:

```powershell
# Rename default branch to main (already main locally)
git branch -M main

# Add your GitHub repository as the origin remote
# (Replace <username> and <repo> with your GitHub details)
git remote add origin https://github.com/<username>/<repo>.git

# Push your main branch to GitHub
git push -u origin main
```

---

## 2. Choosing the Deployment Architecture

To host this multi-package repository (monorepo) for free with all features working, the recommended stack is:

1. **Database**: [Neon.tech](https://neon.tech/) (Generous, permanent Free Tier serverless PostgreSQL).
2. **Backend API Server**: [Render.com](https://render.com/) (Free Web Service tier, supports Node.js monorepos, auto-deploys from GitHub).
3. **Frontend**: [Render.com](https://render.com/) (Free Static Site tier, auto-deploys from GitHub).

---

## 3. Database Deployment (Neon.tech)

1. Sign up/log in at [Neon.tech](https://neon.tech/).
2. Create a new project named `fincoach`.
3. Select your preferred database region (e.g., Singapore or US East) and click **Create Project**.
4. You will be shown a database connection string (URI). Copy it. It looks like:
   `postgresql://neondb_owner:xxxxxx@ep-xxxxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
5. Run your database migrations online using your local command line:
   ```powershell
   # Run this locally, substituting your Neon connection URI
   $env:DATABASE_URL="<your_neon_connection_string>"; pnpm --filter @workspace/db run push
   ```
   *This automatically provisions all tables, relations, and enums directly on your online Neon database.*

---

## 4. Backend Service Deployment (Render.com)

1. Log in to [Render.com](https://render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub account and select your `financial-coach` repository.
3. Configure the Web Service settings:
   - **Name**: `fincoach-api`
   - **Environment**: `Node`
   - **Root Directory**: *Leave completely empty* (default to repository root `/`)
   - **Build Command**: `pnpm install && pnpm --filter @workspace/api-server run build`
   - **Start Command**: `node --enable-source-maps ./artifacts/api-server/dist/index.mjs`
   - **Instance Type**: `Free`
4. Add the following **Environment Variables** in the service settings:
   - `DATABASE_URL`: `<your_neon_connection_string>`
   - `JWT_SECRET`: `<a_random_secure_secret_string>`
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default port)
   - `RAZORPAY_KEY_ID`: `<your_razorpay_key_id>` (Use Razorpay test keys for checkout validation)
   - `RAZORPAY_KEY_SECRET`: `<your_razorpay_key_secret>`
   - `RAZORPAY_PLAN_ID`: `<your_razorpay_plan_id>`
   - `RAZORPAY_WEBHOOK_SECRET`: `<your_razorpay_webhook_secret>`
5. Click **Create Web Service**. Once deployed, copy your service's URL (e.g., `https://fincoach-api.onrender.com`).

---

## 5. Frontend Service Deployment (Render.com)

1. On Render, click **New +** > **Static Site**.
2. Select your `financial-coach` repository.
3. Configure the Static Site settings:
   - **Name**: `fincoach`
   - **Root Directory**: *Leave completely empty* (default to repository root `/`)
   - **Build Command**: `pnpm install && pnpm --filter @workspace/financial-coach run build`
   - **Publish Directory**: `artifacts/financial-coach/dist/public`
   - **Instance Type**: `Free`
4. Add the following **Environment Variables** in the settings:
   - `PORT`: `3000`
   - `BASE_PATH`: `/`
5. Click **Create Static Site**.
6. Once deployed, copy your static site's URL (e.g., `https://fincoach.onrender.com`).

---

## 6. Binding Frontend & Backend (CORS & Cookie Rules)

To ensure cookie-based JWT authentication and CORS work professionally without cross-origin issues in production:

### 1. Cross-Origin Resource Sharing (CORS)
In [artifacts/api-server/src/app.ts](file:///d:/Project/Financial-Coach/artifacts/api-server/src/app.ts), the CORS middleware handles request origins. Ensure it accepts your deployed frontend URL. Update:
```typescript
app.use(cors({
  origin: ["https://fincoach.onrender.com", "http://localhost:3000"], // Add your deployed frontend URL
  credentials: true
}));
```

### 2. Cookie Security
In [artifacts/api-server/src/routes/auth/index.ts](file:///d:/Project/Financial-Coach/artifacts/api-server/src/routes/auth/index.ts) and [artifacts/api-server/src/routes/users/index.ts](file:///d:/Project/Financial-Coach/artifacts/api-server/src/routes/users/index.ts), cookies are signed. For cross-domain authentication (e.g., frontend on `fincoach.onrender.com` communicating with API on `fincoach-api.onrender.com`), set `sameSite: "none"` and `secure: true`:
```typescript
res.cookie("session_token", token, {
  httpOnly: true,
  secure: true, // MUST be true in production for cross-site cookies
  sameSite: "none", // REQUIRED for cross-origin requests
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

### 3. Frontend Fetch URL
Update [lib/api-client-react/src/custom-fetch.ts](file:///d:/Project/Financial-Coach/lib/api-client-react/src/custom-fetch.ts) to communicate with your Render api URL (instead of `http://localhost:5000` or relative `/api` paths if they reside on different domains).
