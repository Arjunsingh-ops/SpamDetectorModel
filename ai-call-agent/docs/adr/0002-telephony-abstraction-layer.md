# ADR 0002: Telephony Abstraction Layer (TAL)

## Status
Accepted

## Context
Deploying an enterprise virtual receptionist requires operating across diverse PSTN and VoIP infrastructures. In North America and Europe, Twilio provides seamless SIP and programmable voice. However, in India, telecommunications compliance under DoT and TRAI requires stringent CLI routing, local interconnects, and specific SIP gateways (such as Exotel, Tata Tele, or Airtel SIP trunks). Hardcoding Twilio TwiML or vendor-specific proprietary APIs directly into FastAPI handlers creates severe vendor lock-in and impedes domestic Indian deployment.

## Decision
We define an abstract `TelephonyAdapter` interface decoupling all core call management logic from vendor protocols:
- Methods: `initiate_call`, `answer_call`, `play_audio`, `transfer_call`, `hangup`, `verify_webhook_signature`, `parse_webhook_event`.
- Implementations:
  - `TwilioAdapter`: Generates standard TwiML and verifies Twilio HMAC signatures.
  - `IndianSipAdapter` / `ExotelAdapter`: Bridges with Indian SIP trunks and local carrier APIs.
  - `MockTelephonyAdapter`: Provides local in-memory simulation for automated tests and Stage 1 local development without PSTN costs or credentials.

## Consequences
- **Positive**: 100% decoupling from telephony vendors; seamless local testing and continuous integration without live phone numbers.
- **Negative**: Requires maintaining adapter translation layers for vendor-specific audio streaming protocols.
