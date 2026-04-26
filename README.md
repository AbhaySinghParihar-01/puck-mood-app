# 🎭 PUCK – Analyse Your Mood

> AI-powered real-time emotion detection using Google Gemini Vision
> Software Engineering Project — BECCS2C025
> Abhay Singh Parihar | 24BECCS01 | CSE Cyber Security | Semester 4
> Central University of Jammu

---

## 🚀 Deploy to Vercel (Step-by-Step)

### Step 1: Get FREE Google AI Studio API Key
1. Go to 👉 https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key (starts with `AIza...`)
5. ✅ Completely FREE — no credit card needed!

### Step 2: Push to GitHub
1. Create a new repo on https://github.com
2. In your unzipped project folder, open terminal and run:
```bash
git init
git add .
git commit -m "PUCK - Analyse Your Mood"
git remote add origin https://github.com/YOUR_USERNAME/puck-mood-app.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New Project** → select puck-mood-app
3. Under **Environment Variables**, add:
   - Name: GOOGLE_API_KEY
   - Value: paste your key from Step 1
4. Click **Deploy** ✅

You will get a live link like puck-mood-app.vercel.app — done!

---

## 💻 Run Locally

```bash
npm install
echo "GOOGLE_API_KEY=AIza..." > .env.local
npm run dev
```
Then open http://localhost:3000

---

## 🎨 Emotion Color Mapping

| Emotion  | Color          |
|----------|----------------|
| 😄 Happy   | 🟢 Green       |
| 🤩 Excited | 🟡 Light Green |
| 😐 Neutral | 🔵 Blue        |
| 😢 Sad     | 🟡 Yellow      |
| 😠 Angry   | 🔴 Red         |
| 😰 Stressed| 🟠 Orange      |

## 🏗 Tech Stack
- Frontend: Next.js 14, React, Tailwind CSS
- AI: Google Gemini 1.5 Flash (Vision API) — FREE
- Deployment: Vercel (Free)

---

*Project for Software Engineering (BECCS2C025), 2025-26*
