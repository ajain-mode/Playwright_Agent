# /testmo-gap-report — Testmo export → agent format & gap analysis

Follow the full SOP in:

**`commands/testmo-to-agent-testcase-format.md`**

## Input

`$ARGUMENTS`

Parse and execute exactly as documented in that file (INPUT, SCOPE, MODE).  
Analysis-only for the gap pass — do **not** generate or execute Playwright specs unless the user later invokes `/generate-and-pass` or `/run-until-pass`.
