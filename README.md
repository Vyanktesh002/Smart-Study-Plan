<div align="center">

<!-- Animated Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1&height=200&section=header&text=Smart%20Study%20Planner&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Study%20Smarter.%20Not%20Harder.&descAlignY=58&descColor=c7d2fe&animation=fadeIn" width="100%"/>

<br/>

<!-- Badges -->
![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)

<br/>

<!-- Hero GIF -->
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDd6dGZ3NTJ1bmR6aGZ6dG5kZGZmM3ptYmJ4NHE3dHNvMTBsaHliZiZlcD12MV9pbnRlcm5hbGdfZ2lmX2J5X2lkJmN0PWc/L1R1tvI9svkIWwpVYr/giphy.gif" width="480" alt="Study Smart"/>

<br/>

> *"An intelligent study companion that learns your schedule, adapts to your priorities, and keeps you in the zone — one Pomodoro at a time."*

<br/>

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [🧠 Algorithm](#-priority-algorithm) • [📡 API](#-api-endpoints) • [🔥 Firebase](#-firebase-setup) • [🎨 Design](#-design-system)

</div>

---

## 🌟 What is Smart Study Planner?

**Smart Study Planner** is a full-stack Flask + Firebase web app that takes the guesswork out of exam prep. Tell it your subjects, exam dates, and difficulty levels — and it generates a **priority-weighted, day-wise timetable** tailored just for you.

<div align="center">
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWo4M2FubWIwbGkzdGc4MGprNXN3bjhkMHU5ZWhwN2IweWd4ZmE0MCZlcD12MV9pbnRlcm5hbGdfZ2lmX2J5X2lkJmN0PWc/ZVik7pIoQDskY8/giphy.gif" width="380" alt="Planning"/>
</div>

Built around three core beliefs:

- 📌 **Priority first** — harder subjects and closer deadlines automatically get more time
- ⏱️ **Flow state matters** — built-in Pomodoro timer keeps you focused and rested
- 📊 **Progress = motivation** — live analytics show how far you've come

---

## ✨ Features

<div align="center">
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXBvanBxMW54ZXFlM3d2MXl1M3hmbzdic2gwbjh2b2gxNXN5bGp1MyZlcD12MV9pbnRlcm5hbGdfZ2lmX2J5X2lkJmN0PWc/3oKIPEqDGUULpEU0aQ/giphy.gif" width="320" alt="Features"/>
</div>

| 🔧 Feature | 📋 Description |
|:---|:---|
| 📚 **Subject Management** | Add, edit, and delete subjects with exam date, difficulty (1–5), prep level, and required hours |
| 🗓️ **Smart Scheduling** | Day-wise timetable with priority-weighted hour allocation |
| 📈 **Progress Tracker** | Log study hours per subject and visualize % completion |
| 📊 **Rich Analytics** | Pie chart (allocation), bar chart (studied vs required), horizontal progress bars |
| 🍅 **Pomodoro Timer** | 25/5/15 min cycles, circular SVG countdown, sound alerts, and session logging |
| ☁️ **Firebase Sync** | All data persisted in Firestore — works across devices in real time |
| 🔥 **Study Streak** | Consecutive daily study streak calculated from session history |
| 📤 **Export** | Download your full timetable as a `.txt` file |
| 💬 **Motivational Quotes** | Curated quotes to kickstart every session |

---

## 🚀 Quick Start

<div align="center">
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjRsaHg2ZHNrMHA0dGNsYm1vd2dvdm9iajRqZ2N6bWdpZHI0NjhvbyZlcD12MV9pbnRlcm5hbGdfZ2lmX2J5X2lkJmN0PWc/xT9IgzoKnwFNmISR8I/giphy.gif" width="340" alt="Getting Started"/>
</div>

### Prerequisites

Make sure you have the following installed:

- ![Python](https://img.shields.io/badge/-Python%203.9%2B-3776AB?logo=python&logoColor=white&style=flat-square)
- A **Firebase project** (free tier works perfectly)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/smart-study-planner.git
cd smart_study_planner
```

### 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 3️⃣ Firebase Setup

<details>
<summary><b>🔧 Click to expand Firebase setup guide</b></summary>

<br/>

#### a) Create a Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → give it a name → Create

#### b) Enable Firestore
1. Navigate to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a region → Done

#### c) Get Your Service Account Key
1. Go to **Project Settings** (⚙️ gear icon) → **Service accounts**
2. Click **"Generate new private key"**
3. Save the downloaded JSON as **`serviceAccountKey.json`** in the project root

```
smart_study_planner/
├── serviceAccountKey.json   ← 📍 place it here
├── app.py
├── scheduler.py
├── firebase_storage.py
...
```

> ⚠️ **NEVER commit `serviceAccountKey.json` to Git.** Add it to `.gitignore` immediately!

</details>

### 4️⃣ Launch the App

```bash
python app.py
```

Then open your browser at:

```
http://localhost:5000
```

<div align="center">

🎉 **You're in!**

</div>

---

## 🧠 Priority Algorithm

<div align="center">
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnd3MjhvMnd5YXo1cWZ5dmFmbHgzbW91cHRkcXQ0aWhzZWJrdjF4ZCZlcD12MV9pbnRlcm5hbGdfZ2lmX2J5X2lkJmN0PWc/l0IypeKl9NJhPFMrK/giphy.gif" width="320" alt="Algorithm"/>
</div>

The scheduler uses a smart formula to allocate study time proportionally across subjects:

```
priority_score = (difficulty × 2 + effective_hours) / max(days_left, 1)
```

### Variables Explained

| Variable | Meaning |
|:---|:---|
| `difficulty` | Subject difficulty you assign (scale of 1–5) |
| `effective_hours` | `required_hours × (1 - (prep_level - 1) / 8)` — higher prep = fewer hours needed |
| `days_left` | Calendar days remaining until your exam date |

> **Higher score = more daily time allocated to that subject.**

### 📊 Example Breakdown

| Subject | Difficulty | Required Hours | Days Left | Priority Score |
|:---:|:---:|:---:|:---:|:---:|
| 📐 Calculus | 5 | 40h | 10 | `(10+40)/10` = **5.0** 🔴 |
| 📜 History | 2 | 20h | 30 | `(4+20)/30` = **0.8** 🟢 |
| ⚛️ Physics | 4 | 30h | 15 | `(8+30)/15` = **2.5** 🟡 |

Calculus gets the lion's share of daily time; History can afford to wait.

---

## 🗂 Project Structure

```
smart_study_planner/
│
├── 🐍 app.py                  # Flask routes & REST API
├── 🧠 scheduler.py            # Priority algorithm & timetable generator
├── 🔥 firebase_storage.py     # Firestore CRUD operations
├── 🔑 serviceAccountKey.json  # Firebase credentials (you provide this)
├── 📦 requirements.txt        # Python dependencies
│
├── 🎨 static/
│   ├── style.css              # Full design system (dark theme, CSS vars)
│   └── app.js                 # SPA frontend logic
│
├── 🌐 templates/
│   └── index.html             # Single-page HTML shell
│
└── 📄 README.md
```

---

## 🔥 Firebase Firestore Collections

<div align="center">
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm83ZHB0Mm5xb3QwYno0d3Q4eWw3ZTM1aGsxcGw2bGd3dGczdGdrdyZlcD12MV9pbnRlcm5hbGdfZ2lmX2J5X2lkJmN0PWc/l3q2K5jinAlChoCLS/giphy.gif" width="300" alt="Firebase"/>
</div>

| 📁 Collection | 🔑 Document Key | 📋 Fields |
|:---|:---|:---|
| `subjects` | auto-ID | `name`, `exam_date`, `difficulty`, `prep_level`, `required_hours`, `hours_studied`, `progress_percent`, `color` |
| `timetable` | `YYYY-MM-DD` | `date`, `day_name`, `sessions[]`, `total_hours` |
| `pomodoro_sessions` | auto-ID | `subject_id`, `subject_name`, `duration_minutes`, `session_type`, `timestamp` |

---

## 📡 API Endpoints

<details>
<summary><b>📋 Click to view all REST API routes</b></summary>

<br/>

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/quote` | 💬 Random motivational quote |
| `GET` | `/api/subjects` | 📚 List all subjects |
| `POST` | `/api/subjects` | ➕ Add a subject |
| `PUT` | `/api/subjects/<id>` | ✏️ Update a subject |
| `DELETE` | `/api/subjects/<id>` | 🗑️ Delete a subject |
| `POST` | `/api/timetable/generate` | 🗓️ Generate & save timetable |
| `GET` | `/api/timetable` | 📅 Get saved timetable |
| `GET` | `/api/progress` | 📈 Progress summary |
| `POST` | `/api/progress/<id>` | 📝 Update subject progress |
| `POST` | `/api/pomodoro/log` | 🍅 Log a Pomodoro session |
| `GET` | `/api/pomodoro/sessions` | 📋 List recent sessions |
| `GET` | `/api/streak` | 🔥 Get study streak |
| `GET` | `/api/export/timetable` | 📤 Download timetable as `.txt` |

</details>

---

## 🎨 Design System

<div align="center">
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGhvaXNiMWNsN2U2MDJjNm5sNmdtazh5dGxodGthbGc5bjBuanFoMCZlcD12MV9pbnRlcm5hbGdfZ2lmX2J5X2lkJmN0PWc/du3J3cXyzhj75IOgvA/giphy.gif" width="300" alt="Design"/>
</div>

| Element | Value |
|:---|:---|
| 🔤 **Font** | Inter (Google Fonts) |
| 🌙 **Theme** | Dark (soft dark neutrals) |
| 💜 **Accent Color** | Indigo `#6366f1` |
| 🎨 **Subject Colors** | Auto-assigned from a curated 12-color palette |
| ✨ **Animations** | View transitions, hover lifts, Pomodoro ring, toast slide-in |

---

## 🛡️ Security Notes

> Take these seriously before going public!

1. 🔑 `serviceAccountKey.json` gives **admin access** to your Firebase project — keep it secret and out of version control
2. 🔒 For production, switch Firestore from "test mode" to **proper security rules**
3. 🌐 Add **HTTPS + authentication** before deploying publicly

---

## 🧪 Troubleshooting

<details>
<summary><b>❌ FileNotFoundError: serviceAccountKey.json not found</b></summary>

Place your Firebase service account key JSON file in the **project root** as `serviceAccountKey.json`.

</details>

<details>
<summary><b>❌ ModuleNotFoundError: No module named 'flask'</b></summary>

Run:
```bash
pip install -r requirements.txt
```

</details>

<details>
<summary><b>❌ 400 Permission denied (Firestore)</b></summary>

Your Firestore rules may be restricting access. In Firebase Console → **Firestore → Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Only use this in development. Lock it down before going to production.

</details>

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License** — free for personal and educational use.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6366f1&height=120&section=footer&animation=fadeIn" width="100%"/>

Made with 💜 by Group ORS and too many Pomodoros

⭐ **Star this repo if it helped you study smarter!** ⭐

</div>
