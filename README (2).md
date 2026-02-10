# Binary Boxer — Smoothness Testing Agent

## Installation

Copy the agent file into your Binary Boxer project:

```bash
# From the binary-boxer project root
mkdir -p .claude/agents
cp bb-smoothness-tester.md .claude/agents/
```

If Claude Code is already running, use `/agents` to reload, or restart the session.

## Usage

### Automatic delegation
Claude Code will delegate to this agent when it detects you're asking about testing, QA, performance, or smoothness. Just say:

```
Run the smoothness tester on the current codebase
```

### Explicit invocation
```
Use the bb-smoothness-tester agent to audit the combat engine
Use the bb-smoothness-tester agent to check animation performance
Use the bb-smoothness-tester agent to run the full test suite
```

### Targeted phases
You can ask it to run specific phases:
```
Use bb-smoothness-tester to run Phase 2 (combat math) only
Use bb-smoothness-tester to run Phase 4 (performance) only
Use bb-smoothness-tester to check edge cases in Phase 6
```

## What It Creates

```
tests/smoothness/
├── combat-math.test.ts      # Phase 2: Formula verification
├── state-machine.test.ts    # Phase 3: State transitions
├── performance.test.ts      # Phase 4: Timing & bundle analysis
├── ui-flow.test.ts          # Phase 5: User experience flows
├── edge-cases.test.ts       # Phase 6: Boundary & chaos tests
└── REPORT.md                # Final compiled report
```

The test files are persistent and re-runnable. The report is regenerated each run.

## When to Run

- After any change to `src/server/engine/` (combat, stats, inheritance, enemy)
- After UI component changes (especially animations or layout)
- After Redis schema changes
- Before any Devvit publish
- After adding new features from the strengthening document

## Agent Configuration

| Field | Value |
|-------|-------|
| Model | Sonnet (fast enough for test execution, smart enough for analysis) |
| Tools | Read, Write, Edit, Bash, Glob, Grep |
| Scope | Project-level (`.claude/agents/`) |
| Output | `tests/smoothness/REPORT.md` |
