# Column Dictionary: timetable.csv

This dictionary documents the schema and expected format of the campus timetable database (`data/timetable.csv`).

| Column Name | Data Type | Description | Format / Allowed Values | Example |
| :--- | :--- | :--- | :--- | :--- |
| `batch` | String | Academic cohort or student section identifier. | Alphanumeric department and section code. | `CS-A`, `CS-B`, `EE-A` |
| `day` | String | Day of the academic week. | Capitalized weekday name (`Monday` through `Friday`). | `Monday`, `Tuesday` |
| `start_time` | String | Scheduled class start time. | 24-hour time format `HH:MM`. | `09:00`, `14:00` |
| `end_time` | String | Scheduled class end time. | 24-hour time format `HH:MM`. | `10:00`, `16:00` |
| `subject` | String | Full title of the course or laboratory session. | Standard course name string. | `Data Structures`, `DBMS Lab` |
| `room` | String | Campus physical classroom or laboratory designation. | Building prefix and room identifier. | `LH-101`, `Lab-3`, `EE-201` |
| `faculty` | String | Assigned instructor or professor name. | Formal title followed by initial and surname. | `Dr. A. Sharma`, `Prof. R. Iyer` |
