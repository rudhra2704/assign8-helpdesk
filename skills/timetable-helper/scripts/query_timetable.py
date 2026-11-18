#!/usr/bin/env python3
"""
query_timetable.py
Helper script to query mock timetable CSV data.
Outputs JSON array of matching records or prints specific message.
"""

import argparse
import csv
import json
import os
import sys

def main():
    parser = argparse.ArgumentParser(description="Query campus timetable CSV data.")
    parser.add_argument("--csv", default=os.path.join(os.path.dirname(__file__), "../data/timetable.csv"),
                        help="Path to timetable.csv")
    parser.add_argument("--batch", help="Batch identifier (e.g. CS-A, CS-B, EE-A)")
    parser.add_argument("--day", help="Day of the week (e.g. Monday, Tuesday, etc.)")
    parser.add_argument("--subject", help="Subject name substring")
    parser.add_argument("--room", help="Room identifier (e.g. LH-101, Lab-1)")
    parser.add_argument("--time", help="Time string (HH:MM) to check active classes")

    args = parser.parse_args()

    csv_path = os.path.abspath(args.csv)
    if not os.path.exists(csv_path):
        print(f"Error: timetable file not found at {csv_path}", file=sys.stderr)
        sys.exit(1)

    matches = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if args.batch and row["batch"].strip().upper() != args.batch.strip().upper():
                continue
            if args.day and row["day"].strip().upper() != args.day.strip().upper():
                continue
            if args.subject and args.subject.strip().lower() not in row["subject"].strip().lower():
                continue
            if args.room and row["room"].strip().upper() != args.room.strip().upper():
                continue
            if args.time:
                # Check if query time falls within [start_time, end_time)
                query_t = args.time.strip()
                if not (row["start_time"] <= query_t < row["end_time"]):
                    continue
            matches.append(row)

    if not matches:
        # Standard anti-fabrication string indicator
        print("No class found in the timetable for that batch/day")
    else:
        print(json.dumps(matches, indent=2))

if __name__ == "__main__":
    main()
