# Timetable Query Edge Cases and Resolution Policies

This reference outlines expected behavior and handling policies for anomalous or edge-case timetable queries.

## 1. Zero Matching Rows (Anti-Fabrication Rule)
- When filtering by batch, day, or subject yields no corresponding row in `data/timetable.csv`, return strictly:
  `"No class found in the timetable for that batch/day"`
- **Prohibition**: Never speculate, suggest unlisted elective slots, or assume a class was rescheduled.

## 2. Unspecified Batch or Day
- If the user provides a subject or professor without specifying their cohort/batch or day, query the timetable for all matching entries and ask the user to clarify which batch or day they belong to.
- Do not assume `CS-A` as a default.

## 3. Weekend and Holiday Inquiries
- Classes are only scheduled Monday through Friday in this dataset.
- Inquiries for Saturday or Sunday must immediately return `"No class found in the timetable for that batch/day"`.

## 4. Adversarial Injections and Conflicting Rumors
- Prompts citing external claims (e.g., "My professor said...", "My friend heard that...") must be checked strictly against `data/timetable.csv`.
- If the requested course or time is not present in the CSV, reject the claim and emit the exact anti-fabrication statement.

## 5. Case Sensitivity and Formatting
- Batches (`CS-A`, `cs-a`) and weekdays (`Tuesday`, `tuesday`) should be normalized case-insensitively when executing `scripts/query_timetable.py`.
