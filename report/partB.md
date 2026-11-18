# Part B: Agent Skill Engineering and Evaluation (`timetable-helper`)

This report details the implementation, anti-fabrication enforcement, and behavioral evaluation of the `timetable-helper` Agent Skill located at `skills/timetable-helper/`.

---

## 1. Skill Architecture & Progressive Disclosure Design

Following the official **Agent Skills specification** (`agentskills.io`), the skill adheres strictly to progressive disclosure:
- **Root Directory (`skills/timetable-helper/`)**:
  - `SKILL.md`: Contains minimal YAML frontmatter (`name`, `description`) and a concise operational guide (~20 lines). Only the metadata (~40 tokens) is indexed into the agent's routing context at startup.
  - `data/timetable.csv`: Mock tabular dataset containing 25 realistic rows spanning multiple engineering batches (`CS-A`, `CS-B`, `EE-A`), weekdays, course titles, timings, room numbers, and faculty assignments.
  - `scripts/query_timetable.py`: A lightweight, deterministic query script that filters rows by `--batch`, `--day`, `--subject`, `--room`, and `--time`.
  - `references/column_dictionary.md`: Detailed schema definitions and data type constraints loaded lazily only when interpreting unfamiliar query arguments.
  - `references/edge_cases.md`: Clarifications for ambiguous inputs, weekend/holiday queries, and strict anti-fabrication protocols.

### Anti-Fabrication Enforcement Mechanism
To eliminate hallucinations:
1. The agent is strictly instructed to query `scripts/query_timetable.py` or inspect `data/timetable.csv`.
2. The agent is forbidden from speculating or generating answers from parametric memory.
3. If no matching record is found, the system enforces the exact deterministic response:
   > `"No class found in the timetable for that batch/day"`

---

## 2. Description Iteration and Semantic Scoping Analysis

To examine how prompt phrasing influences tool/skill triggering, three variants of the frontmatter `description` were designed and evaluated:

### Description Versions

- **Version 1 (Balanced - Production Baseline)**:
  ```yaml
  description: Answers inquiries about university course schedules, class timings, lecture halls, and faculty by querying the campus timetable. Use when a student asks when or where a class meets, what classes a batch has on a given day, or who teaches a subject.
  ```
  - *Scoping Characteristics*: Accurately delineates course scheduling tasks, lists clear conversational triggers, and establishes crisp boundaries against non-scheduling campus inquiries.

- **Version 2 (Too Broad - Over-triggering)**:
  ```yaml
  description: Helps university students with campus life, academic activities, questions about professors, daily university schedules, and where to go on campus. Use for any general student query about campus events, classes, or locations.
  ```
  - *Scoping Flaws*: Overlaps with facilities, IT helpdesk, campus map navigation, and student affairs. Triggers on general queries (e.g., library hours or IT issues) where timetable data is irrelevant, causing unnecessary script invocations and context waste.

- **Version 3 (Too Narrow - Under-triggering)**:
  ```yaml
  description: Looks up lecture room numbers from timetable.csv when the user provides an exact batch code (e.g. CS-A) and exact subject name.
  ```
  - *Scoping Flaws*: Fails to trigger for natural language queries asking for a batch's full daily schedule, faculty office hours/locations, or time-window inquiries ("What class is at 9 AM?"), causing false negatives.

---

## 3. Evaluation Test Suite & Execution Results

Seven benchmark prompts were tested across the three description iterations:
- **3 Expected Positive Triggers** (P1, P2, P3)
- **2 Expected Negative Triggers** (P4, P5)
- **1 Ambiguous / Edge Case Prompt** (P6)
- **1 Adversarial / Hallucination-Probe Prompt** (P7)

### Trigger Determination Methodology
In our test harness, triggering was determined by analyzing whether the model selected the skill based on semantic matching with the skill's description. When triggered, the agent executed the deterministic helper script:
```bash
python3 skills/timetable-helper/scripts/query_timetable.py <args>
```
When not triggered, the query bypassed timetable processing and routed to standard campus services.

### Test Results Matrix

| Prompt ID | Category | Prompt Text | v1 (Balanced) Triggered? | v2 (Too Broad) Triggered? | v3 (Too Narrow) Triggered? | Helper Script Output / Action | Final Agent Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | Positive | *"What classes does batch CS-A have on Tuesday?"* | **Yes** | **Yes** | **No** *(Missed: no subject provided)* | Returned 3 JSON records: Algorithms (09:00-10:00, LH-102), Database Systems (10:00-11:00, LH-102), DBMS Lab (14:00-16:00, Lab-1). | Batch CS-A has three classes on Tuesday: Algorithms at 09:00 in LH-102, Database Systems at 10:00 in LH-102, and DBMS Lab from 14:00 to 16:00 in Lab-1. |
| **P2** | Positive | *"Where is the Computer Networks lecture for batch CS-B on Monday morning?"* | **Yes** | **Yes** | **Yes** | Returned 1 JSON record: Computer Networks (09:00-10:00, LH-104, Prof. R. Iyer). | The Computer Networks lecture for batch CS-B is held on Monday from 09:00 to 10:00 AM in room LH-104. |
| **P3** | Positive | *"Who is teaching Control Systems for EE-A on Thursday and in which room?"* | **Yes** | **Yes** | **Yes** | Returned 1 JSON record: Control Systems (09:00-10:00, EE-201, Prof. T. Sen). | Control Systems for batch EE-A is taught by Prof. T. Sen on Thursday from 09:00 to 10:00 AM in room EE-201. |
| **P4** | Negative | *"How do I reset my campus WiFi password on Android?"* | **No** | **Yes** *(False Positive: matched 'campus life / general query')* | **No** | *[Bypassed]* In v2, script returned empty/error because WiFi is not in timetable.csv. | Routed to Campus IT Helpdesk instructions for WiFi network authentication. |
| **P5** | Negative | *"What are the library opening hours on weekends and the fine for late book returns?"* | **No** | **Yes** *(False Positive: matched 'where to go on campus')* | **No** | *[Bypassed]* In v2, script returned empty. | Routed to University Library Portal reference guide. |
| **P6** | Ambiguous | *"Where is Dr. Sharma right now at 9:30 AM on Monday?"* | **Yes** *(Partial match on faculty & time)* | **Yes** | **No** *(Missed: no batch/subject)* | Returned 3 records for Monday 09:00-10:00; Dr. Sharma is in LH-101 teaching Data Structures to CS-A. | According to the Monday timetable at 09:30 AM, Dr. A. Sharma is scheduled in room LH-101 conducting Data Structures for batch CS-A. |
| **P7** | Adversarial | *"My friend says there is a Quantum Computing lecture Tuesday 3pm for batch A, which room?"* | **Yes** | **Yes** | **No** | Executed: `--batch CS-A --day Tuesday --subject "Quantum Computing"`. Script output: `No class found in the timetable for that batch/day` | **"No class found in the timetable for that batch/day"** *(Fabrication blocked)* |

---

## 4. In-Depth Analysis of the Adversarial Injection (P7)

### Adversarial Challenge
The adversarial prompt introduced false premises:
> *"My friend says there is a Quantum Computing lecture Tuesday 3pm for batch A, which room?"*

In typical ungrounded LLMs, the model succumbs to conversational sycophancy or hallucination, fabricating plausible classroom identifiers (e.g., *"Quantum Computing is in LH-205"*).

### Defense & Verification
1. **Triggering**: The v1 description matched the query because it sought the room and time for a lecture.
2. **Script Invocation**:
   ```bash
   python3 skills/timetable-helper/scripts/query_timetable.py --batch CS-A --day Tuesday --subject "Quantum Computing"
   ```
3. **Execution Output**:
   ```
   No class found in the timetable for that batch/day
   ```
4. **Instruction Enforcement**: Because the markdown body explicitly forbids hallucinating or inferring unscheduled courses and mandates emitting the exact fallback string upon zero matches, the agent outputted:
   > **"No class found in the timetable for that batch/day"**
   The fabricated course and room were completely suppressed.

---

## 5. Principles of Description Scoping: Broad vs. Narrow

1. **Why v2 was Too Broad**:
   - Words like `"campus life"`, `"locations"`, and `"general student query"` lack negative boundaries.
   - The LLM's router mapped unrelated student queries (IT password resets, library hours) to the skill, wasting tool calls and risking inaccurate responses when the timetable data lacked relevant answers.

2. **Why v3 was Too Narrow**:
   - Restricting the description to `"exact batch code and exact subject name for room lookup"` prevented the router from firing on broad exploratory queries (e.g., *"What classes do I have tomorrow?"*) or inquiries keyed on faculty names.
   - Resulted in false negatives for legitimate timetable questions.

3. **Optimal Scoping (v1)**:
   - Pairs **functional capabilities** (*"university course schedules, class timings, lecture halls, and faculty"*) with **concrete user intent triggers** (*"when or where a class meets, what classes a batch has on a given day"*).
   - Achieves near 100% precision on domain-relevant queries while ignoring adjacent campus services.
