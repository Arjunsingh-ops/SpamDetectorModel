# ADR 0003: Multi-Signal Spam & Fraud Scoring Engine

## Status
Accepted

## Context
Traditional call blocking relies solely on static caller-ID blacklists. Fraud syndicates and telemarketers evade blacklists using VoIP CLI spoofing, number recycling, and rotating virtual numbers. Conversely, relying solely on LLM transcript classification incurs latency (300-800ms) and can misclassify unscripted legitimate callers.

## Decision
We implement a multi-factor composite risk scoring engine evaluating three weighted pillars:
1. **Pillar A: Number Reputation & Carrier Telemetry (35% weight)**: Fast lookup (< 50ms) against known spam registries, carrier validation, and call volume burst detection.
2. **Pillar B: Conversational Semantic Analysis (45% weight)**: Real-time lexical analysis detecting fraud scripts (urgency, threats of arrest, financial transfers, impersonation of government agencies).
3. **Pillar C: Behavioral Audio Signals (20% weight)**: Detection of robotic pre-recorded blasts, speech cadence, and refusal to identify oneself upon request.

Thresholds:
- `< 40`: Legitimate -> Instant Transfer.
- `40 - 69`: Uncertain -> Interactive Screening Challenge.
- `>= 70`: High Risk -> Block / Silent Sandbox.

## Consequences
- **Positive**: Resilient against spoofed numbers and novel social engineering tactics; minimizes false positive disconnects.
- **Negative**: Requires tuning threshold weights against empirical call data.
