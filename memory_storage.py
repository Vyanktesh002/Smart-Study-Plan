"""
memory_storage.py — In-memory fallback when Firebase is not configured.
All data resets on server restart. Mirrors the firebase_storage API exactly.
"""
import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional

_subjects: Dict[str, Dict] = {}
_timetable: List[Dict] = []
_progress: Dict[str, Dict] = {}
_pomodoro_sessions: Dict[str, Dict] = {}


# ── Subjects ──────────────────────────────────────────────────────────────────

def get_subjects() -> List[Dict]:
    return [{"id": k, **v} for k, v in _subjects.items()]


def save_subject(subject: Dict) -> str:
    doc_id = str(uuid.uuid4())[:8]
    _subjects[doc_id] = subject
    return doc_id


def update_subject(subject_id: str, data: Dict):
    if subject_id in _subjects:
        _subjects[subject_id].update(data)


def delete_subject(subject_id: str):
    _subjects.pop(subject_id, None)
    _progress.pop(subject_id, None)


# ── Timetable ─────────────────────────────────────────────────────────────────

def get_timetable() -> List[Dict]:
    return _timetable


def save_timetable(timetable: List[Dict]):
    global _timetable
    _timetable = timetable


# ── Progress ──────────────────────────────────────────────────────────────────

def get_progress() -> List[Dict]:
    return [{"id": k, **v} for k, v in _progress.items()]


def update_progress(subject_id: str, data: Dict):
    if subject_id not in _progress:
        _progress[subject_id] = {"subject_id": subject_id}
    _progress[subject_id].update(data)


# ── Pomodoro Sessions ─────────────────────────────────────────────────────────

def save_pomodoro_session(session: Dict) -> str:
    doc_id = str(uuid.uuid4())[:8]
    _pomodoro_sessions[doc_id] = session
    return doc_id


def get_pomodoro_sessions(subject_id: Optional[str] = None) -> List[Dict]:
    sessions = [{"id": k, **v} for k, v in _pomodoro_sessions.items()]
    if subject_id:
        sessions = [s for s in sessions if s.get("subject_id") == subject_id]
    sessions.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
    return sessions[:100]


# ── Study Streak ──────────────────────────────────────────────────────────────

def get_study_streak() -> int:
    work_sessions = [s for s in _pomodoro_sessions.values() if s.get("type") == "work"]
    study_dates = set()
    for s in work_sessions:
        ts = s.get("timestamp", "")
        try:
            d = datetime.fromisoformat(ts).date()
            study_dates.add(d)
        except (ValueError, TypeError):
            pass

    if not study_dates:
        return 0

    streak = 0
    check_date = date.today()
    if check_date not in study_dates:
        check_date -= timedelta(days=1)

    while check_date in study_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak
