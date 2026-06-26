# Legal Pages (Terms & Privacy)

> **Routes:** `/terms`, `/privacy`  
> **Module:** Legal  
> **Generated:** 2026-06-26

## Overview

Legal Pages display platform Terms of Service and Privacy Policy. Features static content with scrollable text, table of contents, and last updated timestamps.

**Primary Use Cases:**
- Review terms of service
- Review privacy policy
- Understand data handling practices
- Review subscription terms

## Fields

### Terms of Service (`/terms`)

| Section | Content Highlights |
|---------|-------------------|
| Acceptance | Must accept to use service |
| Description | Music generation AI platform features |
| User Accounts | Telegram OAuth, account responsibilities |
| Credit System | Cost per generation, purchase, expiry |
| Content Policy | Prohibited content, user-generated content |
| Intellectual Property | Ownership, rights, AI-generated content |
| Payment Terms | Subscription tiers, refund policy |
| Cancellation | Account deletion, data removal |

### Privacy Policy (`/privacy`)

| Section | Content Highlights |
|---------|-------------------|
| Data Collection | Name, email, Telegram ID, usage data |
| Data Usage | Service provision, analytics, improvements |
| Data Sharing | Third-party services (Telegram, Suno AI), no sale of data |
| Data Security | Encryption, access controls, regular audits |
| User Rights | Access, export, deletion requests |
| Cookies | Authentication, analytics, preferences |
| Telegram Integration | Data shared with Telegram (per their policy) |
| Data Retention | Retention periods, deletion policies |

---

## Interactions

### Page Load
- Static content loaded from markdown or database
- No API calls (content pre-rendered or stored)
- Setup Telegram Back Button

### External Links
- **Contact Support:** Opens Telegram chat with support
- **Email:** Opens mail client with support email
- **Social Media:** Links to social profiles

## API Dependencies
None (static pages)

## Page Relationships
**From:** `/settings` → Click "Terms" or "Privacy" link
**To:** Back button → Previous page

## Business Rules
1. **Content:** Legal documents maintained by admin team
2. **Updates:** When terms/policy changes, users notified on next login
3. **Acceptance:** Continued use after changes = acceptance
4. **Language:** Available in Russian (primary) and English (translation)
5. **Versioning:** Version history tracked in database
6. **Compliance:** GDPR compliant (data portability, right to deletion)

---
