#!/usr/bin/env python3
"""
guard_protected_folder.py
PreToolUse hook script that blocks write/edit attempts targeting /protected or protected/ directories.
Reads JSON payload from stdin. Exits with code 2 and writes explanation to stderr if blocked.
Exits with code 0 if permitted.
"""

import sys
import json
import os

def main():
    try:
        payload = json.load(sys.stdin)
    except Exception as e:
        # If payload cannot be parsed, allow without blocking
        sys.exit(0)

    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input", {})

    # Detect targets across file editing, writing, and bash manipulation
    blocked = False
    target_path = ""

    # Check direct path parameters
    for key in ["Path", "path", "file_path", "target_path", "filepath"]:
        if key in tool_input:
            val = str(tool_input[key])
            if "/protected" in val or val.startswith("protected/") or val.startswith("./protected/"):
                blocked = True
                target_path = val
                break

    # Check bash commands targeting protected folder
    if not blocked and tool_name in ["Bash", "run_command"]:
        cmd = tool_input.get("command", "") or tool_input.get("CommandLine", "")
        if any(token in cmd for token in ["/protected", " protected/", "./protected/"]):
            # Check for write/mutation commands
            if any(w in cmd for w in [">", "rm ", "touch ", "mkdir ", "cp ", "mv ", "sed -i", "dd "]):
                blocked = True
                target_path = cmd

    if blocked:
        error_msg = f"SECURITY POLICY VIOLATION: Modification to protected path '{target_path}' is strictly blocked by campus-helpdesk hook."
        sys.stderr.write(error_msg + "\n")
        # Exit code 2 instructs Claude Code / Antigravity hook harness to block execution
        sys.exit(2)

    # Permit all other actions
    sys.exit(0)

if __name__ == "__main__":
    main()
