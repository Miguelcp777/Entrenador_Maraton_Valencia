# Kinetic Lab | Valencia Marathon Training 🏃‍♂️⚡

![App Demo](public/vite.svg) (*Note: Upload your screenshots here in the future*)

**Valencia Marathon Training** (formerly Kinetic Lab) is a hybrid web application (Dashboard + AI Coach) specifically designed and built to monitor, manage, and optimize training for marathon-oriented athletes using the "Valencia 2026" protocol.

It's not just a passive stat tracker; it includes an **AI Analytical Coach** powered by Gemini 2.5, configured with a strict, relentless personality and deep physiological knowledge (*Aurelio*). It's designed to daily audit the athlete's progress and even record and compute data dynamically through database function calls.

## 🚀 Key Features

* **🏆 Biometric Dashboard**
  * Hyper-focused countdown to the Valencia 2026 Marathon.
  * Real-time compliance percentage indicators sourced directly from local database history and weekly status.
  * Tracking of weight, resting heart rate (RHR), and threshold zones based on Karvonen formulas.

* **📅 Predictive & Dynamic Calendar (Macrocycle)**
  * Separation by physiological blocks (Phase 0: Conditioning, Phase 1: Accumulative Base, etc.).
  * Deterministic logic: Aerobic focus days, Long Runs, threshold intervals, and mandatory recharges/rest days.

* **🧠 AI Cognitive Agent ("Aurelio" Coach)**
  * **Engine:** Built with the `@google/generative-ai` SDK aiming at **Gemini 2.5 Flash** for real-time latency.
  * **Fast Daily Analytics:** Evaluates your training logs from the last 7 days with an on-device caching system to issue assessments without draining API quota on every reload.
  * **Persistent Memory:** Automatic context loading from Supabase to preserve a historical memory of all your excuses, fatigue, and feelings.
  * **Biometrics Injection:** The agent knows all the data from your current Athlete Profile and your exact compliance from the database right when starting the conversation.
  * **Autonomous Execution (Tool Calling):** If the athlete reports completing a workout via chat, the AI will detect intentions, map parameters, and **autonomously insert the records into the training calendar**, reducing manual friction to zero.

* **⚙️ Hybrid Authentication System**
  * Main Dashboard entry access protected under a security lock screen, ideal for public internet hosting.
  * Logout system integrated into the control panel.

* **🚴‍♂️ Strava Integration & Extended Telemetry**
  * Seamless synchronization of Strava Activities to the local database.
  * Mathematical fallback engine to automatically recover consumed **Calories** based on the biometric profile, and extract **Steps and Cadence** directly from the watch (Garmin/Strava).

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-18181A?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

* **Frontend:** React (Vite.js) with TypeScript, `mobile-first` architecture.
* **Styles:** TailwindCSS (native dark-mode architecture) with `Inter` and `Space Grotesk` typography.
* **DB & Auth:** Supabase (PostgreSQL + RLS).
* **Artificial Intelligence:** Official Google AI API (Gemini 2.5 Flash with Function Calling).

## 🗄️ Main Database Schema

1. `perfil_atleta`: Metrics and Identity.
2. `plan_maestro`: Macrocycle Configuration.
3. `logs_entrenamiento`: Raw training data (Distance, Temps, Rate of Perceived Exertion - RPE).
4. `interacciones_chat`: AI Agent history knowledge base.

## 💻 Local Installation and Usage

1. Ensure Node.js is installed.
2. Clone the repository:

   ```bash
   git clone <https://github.com/Miguelcp777/Entrenador_Maraton_Valencia.git>
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure your environment variables in the `.env` file at the root of the project:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRAVA_CLIENT_ID=your_strava_api_client_id
   VITE_STRAVA_CLIENT_SECRET=your_strava_api_client_secret
   ```

   *(Note: The Gemini API key is configured dynamically through the hidden **Settings** tab within the App).*

5. Boot up the hot-reload development server:

   ```bash
   npm run dev
   ```

---
*Built to obliterate limits and shatter the sub-3h mark. No excuses.* 🏴‍☠️
