from datetime import datetime, date, timedelta
from typing import List, Dict

def calculate_priority_scores(subjects: List[Dict]) -> Dict[str, float]:
    """
    Priority score formula:
        score = (difficulty * 2 + required_hours) / max(days_left, 1)

    Subjects with higher difficulty, more required hours, and fewer days
    left receive higher priority and more daily study time.
    """
    today = date.today()
    scores = {}
    for s in subjects:
        try:
            exam_dt = datetime.strptime(s["exam_date"], "%Y-%m-%d").date()
            days_left = max((exam_dt - today).days, 1)
        except (ValueError, KeyError):
            days_left = 1

        difficulty = float(s.get("difficulty", 3))
        required_hours = float(s.get("required_hours", 5))
        prep_level = float(s.get("prep_level", 3))

        # Adjust for prep level: higher prep = lower urgency
        adjusted_hours = required_hours * (1 + (5 - prep_level) * 0.15)

        score = (difficulty * 2 + adjusted_hours) / days_left
        scores[s["id"]] = min(score, 10.0)  # Cap the score at 10.0

    return scores


def generate_timetable(subjects: List[Dict], max_daily_hours: float = 6.0) -> List[Dict]:
    """
    Generates a day-wise study timetable.

    Algorithm:
    1. Calculate priority scores for each subject.
    2. Distribute daily hours proportional to priority scores.
    3. Skip days after a subject's exam date.
    4. Continue until all required hours are covered or all exams passed.
    """
    today = date.today()

    # Filter subjects with future exam dates and parse them
    active = []
    for s in subjects:
        try:
            exam_dt = datetime.strptime(s["exam_date"], "%Y-%m-%d").date()
            if exam_dt >= today:
                remaining = float(s.get("required_hours", 5))
                active.append({**s, "exam_date_obj": exam_dt, "remaining_hours": remaining})
        except (ValueError, KeyError):
            pass

    if not active:
        return []

    # Determine planning window (up to nearest exam + 1 day buffer max 90 days)
    latest_exam = max(s["exam_date_obj"] for s in active)
    planning_days = min((latest_exam - today).days + 1, 90)

    timetable = []
    current_day = today

    for _ in range(planning_days):
        # Only include subjects whose exam hasn't passed
        eligible = [s for s in active if s["exam_date_obj"] >= current_day and s["remaining_hours"] > 0.01]
        if not eligible:
            current_day += timedelta(days=1)
            continue

        # Recalculate scores for today
        day_scores = {}
        for s in eligible:
            days_left = max((s["exam_date_obj"] - current_day).days, 1)
            difficulty = float(s.get("difficulty", 3))
            prep_level = float(s.get("prep_level", 3))
            adjusted_hours = s["remaining_hours"] * (1 + (5 - prep_level) * 0.1)
            score = (difficulty * 2 + adjusted_hours) / days_left
            day_scores[s["id"]] = score

        total_score = sum(day_scores.values()) or 1
        slots = []
        total_allocated = 0
        start_hour = 8  # 8:00 AM start

        for s in eligible:
            proportion = day_scores[s["id"]] / total_score
            allocated = round(min(proportion * max_daily_hours, s["remaining_hours"]) * 2) / 2  # round to 0.5h
            allocated = max(allocated, 0.5) if proportion > 0.01 else 0

            if allocated > 0:
                start_str = _fmt_time(start_hour)
                end_hour = start_hour + allocated
                end_str = _fmt_time(end_hour)

                slots.append({
                    "subject_id": s["id"],
                    "subject": s["name"],
                    "hours": allocated,
                    "start_time": start_str,
                    "end_time": end_str,
                    "color": s.get("color", "#6366f1")
                })

                s["remaining_hours"] = max(s["remaining_hours"] - allocated, 0)
                start_hour = end_hour + 0.25  # 15-min break between subjects
                total_allocated += allocated

        if slots:
            timetable.append({
                "date": current_day.isoformat(),
                "day_name": current_day.strftime("%A"),
                "total_hours": round(total_allocated, 1),
                "slots": slots
            })

        current_day += timedelta(days=1)

    return timetable


def _fmt_time(hour_float: float) -> str:
    """Convert a float hour (e.g. 9.5) to a HH:MM string (09:30)."""
    h = int(hour_float) % 24
    m = int((hour_float - int(hour_float)) * 60)
    period = "AM" if h < 12 else "PM"
    display_h = h if h <= 12 else h - 12
    display_h = 12 if display_h == 0 else display_h
    return f"{display_h}:{m:02d} {period}"
