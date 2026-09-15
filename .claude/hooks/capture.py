#!/usr/bin/env python3
"""
Automatic prompt/response capture for Claude Code.

Wired in .claude/settings.json to two lifecycle events:

  UserPromptSubmit -> appends a [LOG_ENTRY type=PROMPT ...] block
  Stop             -> appends a [LOG_ENTRY type=RESPONSE ...] block

Both events hand this script a JSON payload on stdin. The Stop payload carries
`last_assistant_message`, which is the final assistant text for the turn - no
thinking blocks, no tool calls, no intermediate steps. That is precisely what
the log is supposed to contain, so nothing is filtered or reconstructed here.

One file per session: .agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md

This script never blocks a turn. On failure it writes to stderr and exits 1
(non-blocking for Claude Code) so a capture problem is visible but harmless.
"""

import datetime
import glob
import json
import os
import re
import sys

TOOL = "claude-code"
LOG_DIR_NAME = ".agent-logs"
STATE_DIR_NAME = os.path.join(".claude", "hooks", ".state")


# ---------------------------------------------------------------- helpers


def utc_now():
    return (
        datetime.datetime.now(datetime.timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def project_dir(payload):
    return (
        os.environ.get("CLAUDE_PROJECT_DIR")
        or payload.get("cwd")
        or os.getcwd()
    )


def load_config(root):
    path = os.path.join(root, ".claude", "hooks", "capture.config.json")
    try:
        with open(path) as fh:
            return json.load(fh)
    except Exception:
        return {}


def read_state(root, session_id):
    path = os.path.join(root, STATE_DIR_NAME, session_id + ".json")
    try:
        with open(path) as fh:
            return json.load(fh)
    except Exception:
        return {}


def write_state(root, session_id, state):
    d = os.path.join(root, STATE_DIR_NAME)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, session_id + ".json"), "w") as fh:
        json.dump(state, fh, indent=2)


def model_from_transcript(transcript_path):
    """Last model actually used in this session, per the session transcript."""
    if not transcript_path or not os.path.exists(transcript_path):
        return None
    try:
        with open(transcript_path, errors="replace") as fh:
            lines = fh.readlines()
    except Exception:
        return None
    for line in reversed(lines[-800:]):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        msg = obj.get("message") or {}
        model = msg.get("model")
        if obj.get("type") == "assistant" and model:
            return model
    return None


def resolve_model(root, payload, session_id):
    state = read_state(root, session_id)
    model = model_from_transcript(payload.get("transcript_path"))
    if model:
        return model
    return state.get("last_model") or "unknown"


# ---------------------------------------------------------------- log file


def find_log_file(root, session_id):
    matches = sorted(
        glob.glob(os.path.join(root, LOG_DIR_NAME, "*_%s.md" % session_id))
    )
    return matches[0] if matches else None


def create_log_file(root, session_id, cfg, model, now):
    log_dir = os.path.join(root, LOG_DIR_NAME)
    os.makedirs(log_dir, exist_ok=True)
    stamp = now.replace("-", "-")  # 2026-09-15T22:10:11.123Z
    date = stamp[:10]
    clock = stamp[11:19].replace(":", "-")
    path = os.path.join(log_dir, "%s_%s_%s.md" % (date, clock, session_id))

    author = cfg.get("author", "unknown")
    project = cfg.get("project") or os.path.basename(root)
    short = session_id[:8]

    header = (
        "---\n"
        "session_id: %s\n"
        "date: %s\n"
        "author: %s\n"
        "model: %s\n"
        "tool: %s\n"
        "project: %s\n"
        "total_exchanges: 0\n"
        "first_prompt_time: %s\n"
        "last_prompt_time: %s\n"
        "---\n\n"
        "# Session Log - %s\n\n"
        "Session: `%s` | Project: `%s` | Author: `%s`\n\n"
        "---\n\n"
        % (
            session_id,
            date,
            author,
            model,
            TOOL,
            project,
            now,
            now,
            date,
            short,
            project,
            author,
        )
    )
    with open(path, "w") as fh:
        fh.write(header)
    return path


def read_log(path):
    with open(path, errors="replace") as fh:
        return fh.read()


def count_entries(text, kind):
    return len(
        re.findall(r"^\[LOG_ENTRY type=%s num=\d+ session=\S+\]$" % kind, text, re.M)
    )


def entry_counts(root, session_id, path):
    """Authoritative prompt/response counts for this session.

    The sidecar state file is the source of truth. Scanning the log text is
    only a fallback (state deleted, session resumed elsewhere): a response body
    can legitimately quote the log format - this file will, when it documents
    itself - and a text scan would count those quotes as real entries.
    """
    state = read_state(root, session_id)
    if "prompts" in state and "responses" in state:
        return int(state["prompts"]), int(state["responses"])
    text = read_log(path)
    return count_entries(text, "PROMPT"), count_entries(text, "RESPONSE")


def update_frontmatter(path, exchanges, last_time, model):
    """Bookkeeping only: the counters in the frontmatter block.

    Entry bodies are append-only and are never rewritten.
    """
    text = read_log(path)
    head, sep, body = text.partition("\n---\n\n# Session Log")
    if not sep:
        return
    head = re.sub(r"^total_exchanges: .*$", "total_exchanges: %d" % exchanges, head, count=1, flags=re.M)
    head = re.sub(r"^last_prompt_time: .*$", "last_prompt_time: %s" % last_time, head, count=1, flags=re.M)
    if model and model != "unknown":
        head = re.sub(r"^model: .*$", "model: %s" % model, head, count=1, flags=re.M)
    with open(path, "w") as fh:
        fh.write(head + sep + body)


def backfill_prompt_model(path, num, session_short, model):
    """If a prompt landed before any assistant message existed in the session,
    its model line reads `unknown`. Once the turn ends we know the real model,
    so fill in that one field. Prompt and response text are never touched."""
    if not model or model == "unknown":
        return
    text = read_log(path)
    pattern = (
        r"(^\[LOG_ENTRY type=PROMPT num=%d session=%s\]\ntimestamp: [^\n]*\nmodel: )unknown$"
        % (num, re.escape(session_short))
    )
    new_text, n = re.subn(pattern, r"\g<1>%s" % model, text, count=1, flags=re.M)
    if n:
        with open(path, "w") as fh:
            fh.write(new_text)


def append_entry(path, kind, num, session_short, model, now, body):
    entry = "[LOG_ENTRY type=%s num=%d session=%s]\ntimestamp: %s\nmodel: %s\n\n%s\n\n\n" % (
        kind,
        num,
        session_short,
        now,
        model,
        body.rstrip("\n"),
    )
    with open(path, "a") as fh:
        fh.write(entry)


# ---------------------------------------------------------------- events


def handle_prompt(root, payload, cfg):
    session_id = payload.get("session_id") or "unknown-session"
    now = utc_now()
    model = resolve_model(root, payload, session_id)

    path = find_log_file(root, session_id)
    if not path:
        path = create_log_file(root, session_id, cfg, model, now)

    prompts, responses = entry_counts(root, session_id, path)
    num = prompts + 1

    prompt = payload.get("prompt")
    if prompt is None:
        prompt = "(prompt text not supplied by hook payload)"

    append_entry(path, "PROMPT", num, session_id[:8], model, now, prompt)
    update_frontmatter(path, num, now, model)

    state = read_state(root, session_id)
    state.update(
        {
            "log_file": os.path.basename(path),
            "prompts": num,
            "responses": responses,
            "last_prompt_num": num,
            "last_prompt_id": payload.get("prompt_id"),
            "last_model": model,
        }
    )
    write_state(root, session_id, state)


def handle_stop(root, payload, cfg):
    session_id = payload.get("session_id") or "unknown-session"
    now = utc_now()
    model = resolve_model(root, payload, session_id)

    path = find_log_file(root, session_id)
    if not path:
        # Stop without a recorded prompt (e.g. hooks installed mid-session).
        # Nothing to pair it with, so there is nothing honest to write.
        return

    prompts, responses = entry_counts(root, session_id, path)
    if responses >= prompts:
        return  # already answered this prompt; do not double-write

    state = read_state(root, session_id)
    prompt_id = payload.get("prompt_id")
    if prompt_id and state.get("responded_prompt_id") == prompt_id:
        return

    body = payload.get("last_assistant_message")
    if not body:
        body = "(turn ended without a final assistant message - interrupted or empty response)"

    num = responses + 1
    backfill_prompt_model(path, num, session_id[:8], model)
    append_entry(path, "RESPONSE", num, session_id[:8], model, now, body)
    update_frontmatter(path, prompts, now, model)

    state.update(
        {
            "prompts": prompts,
            "responses": num,
            "responded_prompt_id": prompt_id,
            "last_model": model,
        }
    )
    write_state(root, session_id, state)


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    root = project_dir(payload)
    cfg = load_config(root)

    event = payload.get("hook_event_name")
    if event == "UserPromptSubmit" or (not event and "prompt" in payload):
        handle_prompt(root, payload, cfg)
    elif event in ("Stop", None):
        handle_stop(root, payload, cfg)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # never block a turn on a logging failure
        sys.stderr.write("[agent-log capture] %s: %s\n" % (type(exc).__name__, exc))
        sys.exit(1)
