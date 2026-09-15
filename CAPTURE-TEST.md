# CAPTURE-TEST

Proof that automatic prompt/response capture is installed and firing, per step 4 of the
8x assignment setup.

**Status: green.** Two canaries sent in two separate sessions; both the prompt and the
final response landed in `.agent-logs/` without any manual action.

---

## 1. Tool and model

| | |
|---|---|
| **Tool** | Claude Code (CLI), version `2.1.220` |
| **Model** | `claude-opus-5` — specifically `claude-opus-5[1m]` (the 1M-context variant) in the interactive session |
| **Planning vs execution** | Same model does both. There is no separate planner/executor split — Opus 5 plans and executes in one loop. Any mid-build model switch will be visible per-entry, since every `LOG_ENTRY` carries its own `model:` field read from the live session transcript. |
| **Automatic hook mechanism?** | **Yes.** Claude Code has a first-class hooks system — shell commands bound to lifecycle events, configured in `settings.json` and executed by the harness, not by the model. Confirmed against the official docs at <https://code.claude.com/docs/en/hooks> rather than from memory. |

The two events used:

- **`UserPromptSubmit`** — fires when a prompt is submitted, before the model sees it.
  Payload includes `prompt` (verbatim), `session_id`, `prompt_id`, `cwd`, `transcript_path`.
- **`Stop`** — fires when the turn ends. Payload includes **`last_assistant_message`**,
  which is the final assistant text for that turn.

`last_assistant_message` is the reason this log contains exactly what the brief asks for:
it is the *final* message only. Thinking blocks, tool calls, file reads, diffs and
self-corrective retries never appear in it, so nothing has to be stripped or filtered —
there is no intermediate content to remove in the first place.

---

## 2. Mechanism and config

**Files changed / created:**

| Path | Role |
|---|---|
| `.claude/settings.json` | **The config that wires it up.** Binds `UserPromptSubmit` and `Stop` to the capture script. Committed to the repo, so it applies to every session started in this directory. |
| `.claude/hooks/capture.py` | The capture script (executable, `python3`). Reads the hook JSON on stdin, appends one log entry. |
| `.claude/hooks/capture.config.json` | Author handle + project name for the frontmatter. One place to change. |
| `.gitignore` | Explicitly does **not** ignore `.agent-logs/`, with a comment saying so. Ignores only `.claude/hooks/.state/` (pairing counters, no prompt/response content). |

`.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/capture.py", "timeout": 20 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/capture.py", "timeout": 20 } ] }
    ]
  }
}
```

Nothing here depends on me remembering to run anything. The harness invokes the script on
every prompt and every turn end; if the script dies it writes to stderr and exits 1, which
is non-blocking — a capture failure is visible but never eats a turn or blocks a prompt.

**Output:** one file per session at `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md`,
in the exact format specified in the brief.

**What gets written, and what never does.** Entry bodies are strictly append-only — prompt
and response text is written once, verbatim, and never rewritten. Two fields are updated
after the fact, both bookkeeping only, both mandated by the format:

1. Frontmatter counters (`total_exchanges`, `last_prompt_time`, `model`).
2. The `model:` field of a PROMPT entry when it reads `unknown`. On the *first* prompt of a
   session the transcript contains no assistant message yet, so the model is genuinely not
   knowable at submit time; the `Stop` handler fills in that one field once it is. Body text
   is untouched.

---

## 3. Where the canaries landed

```
.agent-logs/2026-09-15_18-00-38_374ccb0b-9326-48b8-a462-eb47ed67418b.md   <- canary 1, session 374ccb0b
.agent-logs/2026-09-15_18-01-27_b37d93b0-0d88-4db0-bb5e-e4dcfbaa6535.md   <- canary 2, session b37d93b0
```

Two different session IDs, two different files, neither created by the session that
installed the hook. That is the point of the second canary: a hook that only works in the
session that wrote it is not installed. This one is installed.

---

## 4. Both canary entries, raw

### Canary 1 — session `374ccb0b`

Full file: `.agent-logs/2026-09-15_18-00-38_374ccb0b-9326-48b8-a462-eb47ed67418b.md`

````
---
session_id: 374ccb0b-9326-48b8-a462-eb47ed67418b
date: 2026-09-15
author: jigyasurajput-aktsk
model: claude-opus-5
tool: claude-code
project: video-arena
total_exchanges: 1
first_prompt_time: 2026-09-15T18:00:38.158Z
last_prompt_time: 2026-09-15T18:01:12.030Z
---

# Session Log - 2026-09-15

Session: `374ccb0b` | Project: `video-arena` | Author: `jigyasurajput-aktsk`

---

[LOG_ENTRY type=PROMPT num=1 session=374ccb0b]
timestamp: 2026-09-15T18:00:38.158Z
model: claude-opus-5

CAPTURE TEST — 8x assignment, Jigyasu Rajput


[LOG_ENTRY type=RESPONSE num=1 session=374ccb0b]
timestamp: 2026-09-15T18:01:12.030Z
model: claude-opus-5

Capture hook verified — it's wired and firing.

**What's in place**

| Piece | Status |
|---|---|
| `.claude/settings.json` | `UserPromptSubmit` + `Stop` → `capture.py`, 20s timeout |
| `.claude/hooks/capture.py` | present, `-rwxr-xr-x` |
| `capture.config.json` | author `jigyasurajput-aktsk`, project `video-arena` |
| `.gitignore` | `.agent-logs/` deliberately tracked; `.state/` ignored |

**This test already landed.** `UserPromptSubmit` fired on submit and created `.agent-logs/2026-09-15_18-00-38_374ccb0b-...md` with the prompt verbatim at `.agent-logs/...md:19-23`, plus pairing state in `.claude/hooks/.state/`.

One thing to expect rather than worry about: `model:` currently reads `unknown` in both the frontmatter and the PROMPT entry. That's correct behavior for the *first* prompt of a session — `model_from_transcript` scans the session transcript for the last `type: assistant` message, and at submit time none existed yet. The `Stop` handler resolves the real model and `backfill_prompt_model` (capture.py:192) patches that one field. So after this turn ends, the entry should read `claude-opus-5[1m]`.

The `RESPONSE num=1` block pairs with this message and is written by the `Stop` hook *after* I finish — so it isn't on disk yet. To confirm the full round-trip, re-read the log file on your next turn: you should see `total_exchanges: 1`, a backfilled `model:`, and a `[LOG_ENTRY type=RESPONSE num=1 session=374ccb0b]` block containing this text.

Worth noting for the submission: the project is otherwise empty (no source, not a git repo yet) — only the capture scaffolding exists. Say the word if you want me to `git init` so the logs start accumulating history alongside the code.
````

### Canary 2 — session `b37d93b0`

Full file: `.agent-logs/2026-09-15_18-01-27_b37d93b0-0d88-4db0-bb5e-e4dcfbaa6535.md`

````
---
session_id: b37d93b0-0d88-4db0-bb5e-e4dcfbaa6535
date: 2026-09-15
author: jigyasurajput-aktsk
model: claude-opus-5
tool: claude-code
project: video-arena
total_exchanges: 1
first_prompt_time: 2026-09-15T18:01:27.297Z
last_prompt_time: 2026-09-15T18:02:04.041Z
---

# Session Log - 2026-09-15

Session: `b37d93b0` | Project: `video-arena` | Author: `jigyasurajput-aktsk`

---

[LOG_ENTRY type=PROMPT num=1 session=b37d93b0]
timestamp: 2026-09-15T18:01:27.297Z
model: claude-opus-5

CAPTURE TEST — 8x assignment, Jigyasu Rajput


[LOG_ENTRY type=RESPONSE num=1 session=b37d93b0]
timestamp: 2026-09-15T18:02:04.041Z
model: claude-opus-5

Capture hook verified end-to-end — and this time there's proof of the full round-trip, not just a prediction.

**This session (`b37d93b0`)** — `UserPromptSubmit` fired on submit and created `.agent-logs/2026-09-15_18-01-27_b37d93b0-....md` with the prompt verbatim at line 23. `model:` reads `unknown` in both the frontmatter and the PROMPT entry, which is expected for the first prompt of a session: `model_from_transcript` (capture.py:77) scans for the last `type: assistant` line and none exists yet at submit time.

**Previous session (`374ccb0b`)** closes the loop that was still open last turn:

| Check | Result |
|---|---|
| `[LOG_ENTRY type=RESPONSE num=1]` appended by `Stop` | ✅ line 26 |
| `backfill_prompt_model` patched the PROMPT `model:` | ✅ `unknown` → `claude-opus-5` (line 21) |
| Frontmatter `model:` updated | ✅ line 5 |
| `last_prompt_time` advanced to the Stop timestamp | ✅ `18:00:38` → `18:01:12` |
| Prompt/response bodies rewritten? | ❌ append-only, as designed |

One correction to what I told you last turn: the backfilled value is `claude-opus-5`, not `claude-opus-5[1m]` — the transcript records the base model ID without the context-window suffix. So expect plain `claude-opus-5` in your logs.

The `RESPONSE num=1` block for *this* turn is written by `Stop` after I finish, so it isn't on disk yet; re-reading the `b37d93b0` log next turn will show it plus the backfilled model.

The project is still just the capture scaffolding — no source, not a git repo. Offer stands to `git init` so the logs accumulate history alongside the code.
````

Both canary responses are the agent reasoning out loud about its own capture setup, and
both contain a factual slip — canary 1 predicts the model will backfill as
`claude-opus-5[1m]`, and canary 2 opens by correcting that to `claude-opus-5`. Left in
exactly as written. That is what the log is for.

---

## 5. What I tried first that did not work

Four things, in order. All are visible in the git history of this repo.

**1. Planned to reconstruct the final response by parsing the session transcript.**
My first design read `transcript_path` from the `Stop` payload, walked the JSONL backwards,
and collected trailing assistant `text` blocks while skipping `thinking` and `tool_use`
blocks — because the brief wants the final response and nothing in between. Then I checked
the docs instead of trusting memory and found `Stop` already supplies `last_assistant_message`.
Deleted the reconstruction logic before writing it. The transcript is still parsed, but only
to read the model name (`message.model`), which the hook payload does not carry.

**2. First dry run crashed: `JSONDecodeError: Invalid control character at line 1 column 199`.**
A test-harness bug, not a hook bug — zsh's `echo` expands `\n` by default, so my synthetic
payload had raw newlines inside a JSON string literal. Rebuilt the fixtures with
`python3 -c 'json.dumps(...)'`. Worth noting because it is exactly the failure mode the real
hook must survive: prompts and responses are full of newlines, backticks and code fences.
The real path never string-builds JSON — it reads `json.load(stdin)`.

**3. The entry counter was genuinely broken, and a sanity check caught it.**
Numbering worked by scanning the log text for lines matching `^[LOG_ENTRY type=PROMPT `.
Then `grep -c LOG_ENTRY` returned **3** for a file with 2 entries: canary 2's *response body*
quotes the log format, and the body is stored verbatim, so the scan counted the quote as a
real entry. Left alone this drifts every subsequent `num=`, and it would have broken on the
very next turn — this document quotes the format too.

Fixed by making a per-session sidecar state file the authoritative counter, with the text
scan kept only as a fallback for a missing state file (and tightened to require a full
`num=N session=X` header). Regression test: a response body containing a line-anchored
`[LOG_ENTRY type=PROMPT num=99 ...]`, followed by a real prompt.

```
19:[LOG_ENTRY type=PROMPT num=1 session=regress0]
26:[LOG_ENTRY type=RESPONSE num=1 session=regress0]
32:[LOG_ENTRY type=PROMPT num=99 session=regress0]   <- quoted inside the response body, verbatim
39:[LOG_ENTRY type=PROMPT num=2 session=regress0]    <- correct; was num=3 before the fix
46:[LOG_ENTRY type=RESPONSE num=2 session=regress0]
```

**4. `model: unknown` on the first prompt of every session.**
Not a bug so much as an unavoidable ordering problem: at `UserPromptSubmit` time a brand-new
session has no assistant message in its transcript, so there is no model to read. Rejected
hardcoding the model name (it would hide exactly the mid-build model switch the brief wants
visible). Settled on the `Stop`-time backfill of that single field, described in §2.

**Synthetic test files were deleted.** The dry-run and regression runs produced
`*dryrun*.md` and `*regress*.md` in `.agent-logs/`; both were removed. They contained
fabricated prompts and responses, not real turns, and leaving invented entries in a log whose
whole value is that it is an honest record seemed worse than removing them. No real
prompt or response has been deleted, edited, or tidied — and none will be.

---

## 6. Known limitation, stated up front

Hooks are read when a session starts. The interactive session in which this capture setup was
*built* began before `.claude/settings.json` existed, so that one session's early turns —
including the message containing the assignment brief itself — may not have been captured.
Every session started after installation is covered, which both canaries demonstrate. If the
very first turns are missing from `.agent-logs/`, that is why, and it is not repaired
retroactively by hand.
