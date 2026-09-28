# Telephony Integration & Webhook Security Setup

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Overview & Dual-Mode Telephony Architecture

The AI Call Agent implements a dual-mode telephony architecture:
1. **Mock Telephony Adapter (`mock`)**: Enables 100% free local development, testing, and browser call simulation without any paid cloud accounts or carrier numbers.
2. **Twilio / PSTN Telephony Adapter (`twilio`)**: Integrates real PSTN carrier lines over HTTP webhooks and WebSockets.

---

## 2. Setting Up Twilio Inbound & Outbound Webhooks

### Step 1: Purchasing a Programmable Voice Number
1. Log into your [Twilio Console](https://console.twilio.com/).
2. Navigate to **Phone Numbers** -> **Manage** -> **Buy a Number**.
3. Select your target country (e.g. India `+91` or US `+1`) and enable **Voice** capability.

### Step 2: Configuring Inbound Voice Webhook URL
In your Twilio Phone Number configuration:
- **A CALL COMES IN**: Select `Webhook` -> `HTTP POST`
- **URL**: `https://api.yourcompany.com/api/v1/telephony/webhook`
- **PRIMARY HANDLER**: Select `Webhook` -> `HTTP POST`
- **STATUS CALLBACK URL**: `https://api.yourcompany.com/api/v1/telephony/status`

### Step 3: Configuring Webhook Signature Verification
To prevent spoofed calls, configure `TELEPHONY_WEBHOOK_SECRET` in your backend `.env`:
```env
TELEPHONY_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_actual_auth_token
TWILIO_PHONE_NUMBER=+911140000000
TELEPHONY_WEBHOOK_SECRET=your_twilio_auth_token
```

---

## 3. Important Considerations for India (`+91`) Deployment

> [!IMPORTANT]
> **Telephony Carrier Compliance in India**:
> 1. Personal Indian mobile numbers (`+91 98xxx`) **cannot** be connected directly to programmable SIP/Voice webhooks without carrier business trunking.
> 2. For India deployments, use a dedicated **Toll-Free (`1800`)** or **Landline DID (`011 / 022 / 080`)** number provided through an authorized enterprise partner (e.g., Twilio India, Exotel, or Tata Tele).
> 3. Ensure DND (Do Not Disturb) scrubbers and TRAI regulatory consent guidelines are respected for outbound transfers.
