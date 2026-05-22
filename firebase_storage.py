"""
firebase_storage.py — Firestore read/write for Smart Study Planner.

Requires serviceAccountKey.json in the project root.
Collections used:
  - subjects
  - timetable      (single doc: "current")
  - progress
  - pomodoro_sessions
"""
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
import os

# Initialize Firebase app (only once)
_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH") or os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if not os.path.exists(_cred_path):
    raise FileNotFoundError(f"Firebase service account file not found at: {_cred_path}")

if not firebase_admin._apps:
    cred = credentials.Certificate(_cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()


# ── Subjects ──────────────────────────────────────────────────────────────────

def get_subjects() -> List[Dict]:
    docs = db.collection("subjects").stream()
    subjects = []
    for doc in docs:
        s = doc.to_dict()
        s["id"] = doc.id
        subjects.append(s)
    return subjects


def save_subject(subject: Dict) -> str:
    update_time, ref = db.collection("subjects").add(subject)
    return ref.id


def update_subject(subject_id: str, data: Dict):
    db.collection("subjects").document(subject_id).update(data)


def delete_subject(subject_id: str):
    db.collection("subjects").document(subject_id).delete()
    # Also remove associated progress
    try:
        db.collection("progress").document(subject_id).delete()
    except Exception:
        pass


# ── Timetable ─────────────────────────────────────────────────────────────────

def get_timetable() -> List[Dict]:
    doc = db.collection("timetable").document("current").get()
    if doc.exists:
        return doc.to_dict().get("days", [])
    return []


def save_timetable(timetable: List[Dict]):
    db.collection("timetable").document("current").set({
        "days": timetable,
        "generated_at": datetime.utcnow().isoformat()
    })


# ── Progress ──────────────────────────────────────────────────────────────────

def get_progress() -> List[Dict]:
    docs = db.collection("progress").stream()
    progress = []
    for doc in docs:
        p = doc.to_dict()
        p["id"] = doc.id
        progress.append(p)
    return progress


def update_progress(subject_id: str, data: Dict):
    ref = db.collection("progress").document(subject_id)
    doc = ref.get()
    if doc.exists:
        ref.update(data)
    else:
        ref.set({**data, "subject_id": subject_id})


# ── Pomodoro Sessions ─────────────────────────────────────────────────────────

def save_pomodoro_session(session: Dict) -> str:
    update_time, ref = db.collection("pomodoro_sessions").add(session)
    return ref.id


def get_pomodoro_sessions(subject_id: Optional[str] = None) -> List[Dict]:
    query = db.collection("pomodoro_sessions")
    if subject_id:
        query = query.where("subject_id", "==", subject_id)
    docs = query.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(100).stream()
    sessions = []
    for doc in docs:
        s = doc.to_dict()
        s["id"] = doc.id
        sessions.append(s)
    return sessions


# ── Study Streak ──────────────────────────────────────────────────────────────

def get_study_streak() -> int:
    """
    Returns the current consecutive study streak in days.
    A day counts if at least one completed work Pomodoro session exists.
    """
    docs = (
        db.collection("pomodoro_sessions")
        .where("type", "==", "work")
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(200)
        .stream()
    )

    study_dates = set()
    for doc in docs:
        ts = doc.to_dict().get("timestamp", "")
        try:
            d = datetime.fromisoformat(ts).date()
            study_dates.add(d)
        except (ValueError, TypeError):
            pass

    if not study_dates:
        return 0

    streak = 0
    check_date = date.today()
    # Allow today OR yesterday as the streak start
    if check_date not in study_dates:
        check_date -= timedelta(days=1)

    while check_date in study_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak
