#!/usr/bin/env python3
import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "availability.json"
URL = os.environ.get("BOOKING_ICAL_URL", "").strip()

if not URL:
    print("BOOKING_ICAL_URL is not configured.", file=sys.stderr)
    sys.exit(2)

try:
    req = urllib.request.Request(
        URL,
        headers={"User-Agent": "UnAirDeToscane-CalendarSync/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read().decode("utf-8", errors="replace")
except Exception as exc:
    print(f"Calendar download failed: {type(exc).__name__}", file=sys.stderr)
    sys.exit(3)

# RFC 5545 line unfolding: a line beginning with a space/tab continues the previous line.
physical = raw.replace("\r\n", "\n").replace("\r", "\n").split("\n")
lines = []
for line in physical:
    if line.startswith((" ", "\t")) and lines:
        lines[-1] += line[1:]
    else:
        lines.append(line)


def parse_ical_date(value: str):
    """Return a date from an iCalendar DATE or DATE-TIME value."""
    value = value.strip()
    m = re.match(r"^(\d{8})", value)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1), "%Y%m%d").date()
    except ValueError:
        return None


events = []
current = None
for line in lines:
    if line == "BEGIN:VEVENT":
        current = {}
        continue
    if line == "END:VEVENT":
        if current is not None:
            start = current.get("start")
            end = current.get("end")
            status = (current.get("status") or "").upper()
            # Cancelled events must not block dates.
            if start and status != "CANCELLED":
                if not end or end <= start:
                    end = start + timedelta(days=1)
                events.append((start, end))
        current = None
        continue
    if current is None or ":" not in line:
        continue
    keypart, value = line.split(":", 1)
    key = keypart.split(";", 1)[0].upper()
    if key == "DTSTART":
        current["start"] = parse_ical_date(value)
    elif key == "DTEND":
        current["end"] = parse_ical_date(value)
    elif key == "STATUS":
        current["status"] = value.strip()

# Merge overlapping or directly adjacent periods.
events.sort(key=lambda item: (item[0], item[1]))
merged = []
for start, end in events:
    if merged and start <= merged[-1][1]:
        if end > merged[-1][1]:
            merged[-1] = (merged[-1][0], end)
    else:
        merged.append((start, end))

payload = {
    "source": "Booking.com iCal",
    "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "bookedRanges": [
        {"from": start.isoformat(), "to": end.isoformat()}
        for start, end in merged
    ],
}

# Write only after a successful download + parse, so a temporary Booking outage
# never erases the last known availability data.
tmp = OUT.with_suffix(".json.tmp")
tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
tmp.replace(OUT)
print(f"Calendar synchronized: {len(payload['bookedRanges'])} unavailable period(s).")
