---
description: Query the university timetable for a specific batch and weekday.
usage: /campus-helpdesk:check-timetable <batch> <day>
---

# Check Timetable Command

Execute the timetable inquiry workflow:
1. Parse the `<batch>` (e.g. `CS-A`, `CS-B`, `EE-A`) and `<day>` (e.g. `Monday`, `Tuesday`) arguments supplied by the user.
2. If arguments are missing, ask the user to specify their batch and day.
3. Query the timetable data via `skills/timetable-helper/scripts/query_timetable.py --batch <batch> --day <day>`.
4. Return the formatted schedule list (Subject, Room, Start/End time, Faculty). If no matches are found, output: "No class found in the timetable for that batch/day".
