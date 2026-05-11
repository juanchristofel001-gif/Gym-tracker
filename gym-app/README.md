# 🏋️ Gym Tracker PWA

Personal gym workout tracker with rank system, protein/hydration/sleep tracking.

## 🚀 Deploy to Vercel (Easiest — Free)

### Option A: GitHub + Vercel (Recommended)
1. Create a **GitHub** account if you don't have one → github.com
2. Click **"New repository"** → name it `gym-tracker` → **Create**
3. Upload all these project files to the repo (drag & drop works)
4. Go to **vercel.com** → Sign up with GitHub
5. Click **"New Project"** → Import your `gym-tracker` repo
6. Framework: **Vite** (should auto-detect)
7. Click **Deploy** → Done! You'll get a URL like `gym-tracker-xxx.vercel.app`

### Option B: Vercel CLI (If you have Node.js)
```bash
npm install
npm run build
npx vercel --prod
```

## 📱 Install as App on Your Phone

After deploying, open the URL on your phone:

### Android
1. Open the URL in **Chrome**
2. Tap the **⋮** menu → **"Add to Home Screen"** or **"Install App"**
3. Done! It appears as an app icon

### iPhone
1. Open the URL in **Safari**
2. Tap the **Share** button (↑) → **"Add to Home Screen"**
3. Done!

## 🛠 Run Locally
```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`

## Features
- 5-day workout plan with MIN/OPT/MAX tiers
- XP + Rank system (Newbie → Legend)
- Protein intake tracker
- Hydration tracker (water glasses)
- Sleep/rest tracker
- Streak counter
- Weekly history
- Works offline (PWA)
- All data saved locally
