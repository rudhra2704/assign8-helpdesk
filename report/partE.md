# Part E: Git Worktrees Simulation, Conflict Resolution & Parallel Architecture

This report details the execution of three parallel workstreams in the `campus-helpdesk-agent` repository using native Git worktrees, the manual resolution of a merge conflict, technical analysis of worktree resource sharing, and a factual evaluation of automated AI merge claims.

---

## 1. Creating Three Linked Worktrees

Three isolated linked worktrees were created from the `main` branch to support concurrent engineering tasks:
- `feature/skill-tests` at `../wt-skill-tests`
- `feature/mcp-server` at `../wt-mcp-server`
- `bugfix/hook-path` at `../wt-hook-path`

### Real Commands Executed:
```bash
git worktree add ../wt-skill-tests -b feature/skill-tests
git worktree add ../wt-mcp-server -b feature/mcp-server
git worktree add ../wt-hook-path -b bugfix/hook-path
```

### Real Command Output:
```
Preparing worktree (new branch 'feature/skill-tests')
HEAD is now at 1f07336 feat: complete campus-helpdesk-agent core implementation and audit reports
Preparing worktree (new branch 'feature/mcp-server')
HEAD is now at 1f07336 feat: complete campus-helpdesk-agent core implementation and audit reports
Preparing worktree (new branch 'bugfix/hook-path')
HEAD is now at 1f07336 feat: complete campus-helpdesk-agent core implementation and audit reports
```

### Real Output of `git worktree list`:
```bash
$ git worktree list
/Users/rudra_yadav777/ASS8AI/campus-helpdesk-agent 1f07336 [main]
/Users/rudra_yadav777/ASS8AI/wt-hook-path          1f07336 [bugfix/hook-path]
/Users/rudra_yadav777/ASS8AI/wt-mcp-server         1f07336 [feature/mcp-server]
/Users/rudra_yadav777/ASS8AI/wt-skill-tests        1f07336 [feature/skill-tests]
```

---

## 2. Independent Changes, Intentional Conflict & Manual Resolution

### A. Independent Change on `bugfix/hook-path`
In `../wt-hook-path`, the plugin manifest version was updated:
```bash
cd /Users/rudra_yadav777/ASS8AI/wt-hook-path
# Updated "version": "1.0.1-hookfix" in plugin.json
git commit -am "fix(hook): update plugin version for hook path fix"
```
*Commit Hash: `04f5fe8`*

### B. Deliberate Conflict Creation Between `feature/skill-tests` and `feature/mcp-server`
Both branches created and modified the exact same file (`skills/timetable-helper/test_config.js`) on line 1:

1. **On `feature/skill-tests`**:
   ```javascript
   export const TEST_MODE = 'SKILL_EVAL_V1';
   ```
   *Commit Hash: `2e78846` ("feat(skills): add skill evaluation test suite configuration")*

2. **On `feature/mcp-server`**:
   ```javascript
   export const TEST_MODE = 'MCP_LIVE_INTEGRATION_V2';
   ```
   *Commit Hash: `cc226b9` ("feat(mcp): configure test runner for mcp integration")*

### C. Triggering the Conflict via Merge:
In `../wt-mcp-server`, merging `feature/skill-tests` immediately raised a conflict:
```bash
$ cd /Users/rudra_yadav777/ASS8AI/wt-mcp-server
$ git merge feature/skill-tests
Auto-merging skills/timetable-helper/test_config.js
CONFLICT (add/add): Merge conflict in skills/timetable-helper/test_config.js
Automatic merge failed; fix conflicts and then commit the result.
```

### D. Conflict Marker Inspection:
```text
<<<<<<< HEAD
export const TEST_MODE = 'MCP_LIVE_INTEGRATION_V2';
=======
export const TEST_MODE = 'SKILL_EVAL_V1';
>>>>>>> feature/skill-tests
```

### E. Manual Resolution & Merge Commit:
The conflict was manually resolved by uniting the configurations:
```javascript
// Resolved merge conflict combining skill tests with MCP integration
export const TEST_MODE = 'HYBRID_SKILL_AND_MCP_TESTS_V3';
```

Staged and committed:
```bash
git add skills/timetable-helper/test_config.js
git commit -m "merge: resolve conflict in test_config.js between skill-tests and mcp-server"
```
*Merge Commit Hash: `7e031ea`*

### F. Real Output of `git log --oneline --graph --all`:
```
*   7e031ea (feature/mcp-server) merge: resolve conflict in test_config.js between skill-tests and mcp-server
|\  
| * 2e78846 (feature/skill-tests) feat(skills): add skill evaluation test suite configuration
* | cc226b9 feat(mcp): configure test runner for mcp integration
|/  
| * 04f5fe8 (bugfix/hook-path) fix(hook): update plugin version for hook path fix
|/  
* 1f07336 (HEAD -> main) feat: complete campus-helpdesk-agent core implementation and audit reports
* 8efe81e initial commit
```

---

## 3. Deep-Dive: Git Worktree Mechanics

### (a) Why Git Refuses the Same Branch in Two Worktrees by Default
Git strictly forbids checking out the same branch simultaneously in multiple worktrees (`fatal: '<branch>' is already used by worktree at '...'`) to protect repository integrity. In Git architecture, a branch ref (`refs/heads/<branch>`) points to a single commit tip. If two separate working directories with independent working trees and indices were tied to the same branch reference, committing in Worktree A would advance the ref pointer without updating the index or working files in Worktree B. Subsequent commits or checkout operations in Worktree B would silently overwrite history, cause detached heads, or create index corruption. Git requires the `-f` (`--force`) flag to bypass this safeguard, or requires checking out in detached `HEAD` mode.

### (b) What is Shared vs. What is Isolated Between Worktrees
- **Shared Across All Worktrees**:
  - The core `.git` directory and its object database (`.git/objects/`), containing all commits, blobs, trees, and tags.
  - Repository branch references (`refs/heads/`, `refs/remotes/`), hooks (`.git/hooks/`), and the common configuration file (`.git/config`).
  - Commits made in any worktree become instantly reachable by hash across all other linked worktrees without network fetches.
- **Isolated Per Worktree**:
  - Working tree filesystem directories (tracked source files, untracked drafts, `.env` files, build caches, and private `node_modules/`).
  - Private administrative directory (`.git/worktrees/<name>/`) storing individual `HEAD` pointers, worktree-private index files, and git status staging states.
  - Untracked files and local environment files (such as secret `.env` keys) exist only in the worktree where they are created and are never automatically copied across trees.

### (c) Safely Cleaning Up Stale Worktrees (`git worktree list`, `remove`, `prune`)
According to official Git documentation ([git-scm.com/docs/git-worktree](https://git-scm.com/docs/git-worktree)):
1. **Audit Active Worktrees**:
   Always run `git worktree list` first to view all paths, linked commit hashes, and associated branches.
2. **Standard Removal (`git worktree remove`)**:
   When the folder still exists on disk, run `git worktree remove <path>`. This command safely checks that the tree contains no untracked or uncommitted changes, deletes the working folder, and cleans up the `.git/worktrees/<name>` administrative metadata.
3. **Pruning Orphaned Metadata (`git worktree prune`)**:
   If a user or script deletes a worktree directory manually (e.g., via `rm -rf`), Git retains stale metadata in `.git/worktrees/`, leading to errors like *"already checked out at..."*. Running `git worktree prune -v` scans `.git/worktrees/`, detects directories that no longer exist on disk, and safely expunges their orphaned metadata records.

---

## 4. Evaluation of the CTO's Claim: `/worktree-merge` in Claude Code

### The CTO's Claim:
> *"Use the built-in `/worktree-merge` command in Claude Code, which resolves conflicts automatically, so no manual review is needed."*

### Official Verification:
- **Search Target**: Official Anthropic Claude Code documentation ([docs.anthropic.com](https://docs.anthropic.com)).
- **Date Accessed**: 18 Nov 2026.
- **Finding**: **False / Non-existent**.
- **Explanation**: The command `/worktree-merge` is **not** a built-in Claude Code command. Official built-in commands include `/init`, `/compact`, `/clear`, `/model`, `/plan`, `/rewind`, `/resume`, and `/help`. While Claude Code officially recommends using Git worktrees for parallel agent sessions, merging branches remains a Git-level operation (`git merge` / `git rebase`). Custom workflows resembling worktree mergers exist only as community scripts or third-party skills, not as native automated primitives.

### The Dangers of Autonomous AI Merging Without Human Review:
The CTO's assertion that *"conflicts are resolved automatically, so no manual review is needed"* represents a severe operational and architectural hazard:
1. **Semantic Drift & Silent Logic Bugs**: Git conflicts occur when logic diverged. While an LLM can effortlessly resolve syntactic syntax conflicts (making code compile), it frequently fails to resolve semantic contradictions. For instance, if Branch A updates a database function signature and Branch B adds callers using the old signature, an unreviewed auto-merge may silently drop critical validations or produce runtime errors that pass static type checks.
2. **Loss of Developer Intent & Hallucinated Combinations**: In complex code conflicts, resolving a conflict requires understanding architectural roadmaps and security trade-offs. Automated merging without human review risks the AI hallucinating hybrid functions that satisfy neither branch's original intent.
3. **Security Vulnerability Introduction**: Merge conflicts often involve authentication boundaries, permission checks, or dependency versions. Automatically resolving dependency conflicts without human review can reintroduce known CVEs or downgrade critical security patches.
4. **Conclusion**: Human-in-the-loop code review is mandatory for merge conflict resolution. AI agents should assist by summarizing conflicting diffs and proposing options, but must never commit autonomous merge resolutions to production branches without human sign-off.
