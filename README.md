<div align="center">

# 🏥 CuraQueue

**Smart Clinic Queue Coordinator**

A real-time clinic queue management system that seamlessly connects receptionists with patients to eliminate waiting room uncertainty.

</div>

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **Reception Panel** | Keyboard-optimized patient check-in with Alt+N hotkeys, emergency priority toggling, and real-time queue management |
| **Lobby TV Monitor** | High-contrast billboard display for waiting areas with animated token calls, queue trend graph, and rotating health tips |
| **Waiting Room View** | Patient-facing search and live timeline board with estimated wait times |
| **Clinical Audit** | Firestore-backed timestamp analysis — registration vs. consultation durations, searchable historic records |
| **Voice Announcements** | Web Speech API integration for audible patient token calls on lobby displays |
| **Dark / Light Mode** | Full theme toggle — mint-accented light mode and sky-blue dark mode |

## 🛠 Tech Stack

- **Frontend**: React 19 · TypeScript · Tailwind CSS v4 · Framer Motion
- **Backend**: Express.js · WebSocket (real-time sync) · REST fallback
- **Database**: Firebase Firestore (persistent audit logs)
- **AI**: Gemini API integration for intelligent health tips
- **Build**: Vite 6 · esbuild

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and Firebase config

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📦 Production Build

```bash
npm run build   # Bundles client + server
npm start       # Runs production server
```

## 🏗 Project Structure

```
├── src/
│   ├── App.tsx                    # Root app with WebSocket + tab routing
│   ├── index.css                  # Theme system + design tokens
│   ├── components/
│   │   ├── LandingPage.tsx        # Marketing-style home page
│   │   ├── ReceptionistPanel.tsx  # Clerk check-in interface
│   │   ├── WaitingRoomPanel.tsx   # Patient-facing queue display
│   │   ├── LobbyTVMode.tsx        # Fullscreen TV billboard
│   │   ├── ClinicalAuditReport.tsx# Firestore audit analytics
│   │   ├── CuraQueueLogo.tsx      # Dynamic SVG brand logo
│   │   └── HealthTipDisplay.tsx   # AI-powered health tip carousel
│   └── services/
│       ├── VoiceAnnouncer.ts      # Web Speech API voice engine
│       └── QueueAnalytics.ts      # Queue trend data collector
├── server.ts                      # Express + WebSocket server
├── firestore.rules                # Firestore security rules
└── index.html                     # Entry point with SEO meta tags
```

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features |
| `APP_URL` | Deployment URL (auto-injected on Cloud Run) |

## 📄 License

Apache-2.0
