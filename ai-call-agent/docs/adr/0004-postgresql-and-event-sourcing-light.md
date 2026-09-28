# ADR 0004: PostgreSQL Persistence with Light Event Sourcing

## Status
Accepted

## Context
Telephony calls progress through non-linear states: ringing, answered, greeting, intent recognition, spam evaluation, transfer attempts, hold states, and termination. Debugging failed call transfers or suspicious interactions requires exact chronological forensic reconstruction of what the caller said, when the AI responded, and what state decisions were made.

## Decision
We implement a hybrid relational model in PostgreSQL 16:
1. `calls`: Canonical entity storing current status, accumulated durations, final scores, and aggregate metadata.
2. `call_events`: Append-only immutable log of state transitions and subsystem signals (`GREETING_STARTED`, `INTENT_EXTRACTED`, `SPAM_EVALUATED`, `TRANSFER_REQUESTED`, `TRANSFER_FAILED`, `CALL_ENDED`).
3. Large binary payloads (audio recordings) are kept in private S3 storage, keeping PostgreSQL lean and performant.

## Consequences
- **Positive**: Complete timeline auditability, straightforward analytics, relational integrity, zero risk of bloating database with binary audio.
- **Negative**: Requires inserting events alongside state transitions.
