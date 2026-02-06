---

Version: 1.0 (Prototype Specification)
Target Pilots: San Miguel de Allende (Restaurants) & CDMX (Bars)
Tech Stack: Next.js (App Router), Tailwind CSS, Cloudflare Pages (Edge Runtime)

---

# 🍻 Project Atlalli Prototype: System Overview

---
## 1. The Value Proposition

A content-driven loyalty platform that uses YouTube subscriptions as a gatekeeper for exclusive rewards. It transforms anonymous drinkers into a verified "Taste Map" database, providing users with expert recommendations, location-based discovery, and partners with a performance-based marketing tool.

---

## 2. User Journey & Core Logic

### A. Authentication & Tiered Gating

The app uses **NextAuth.js** with Google SSO to verify identity. It leverages the Google Profile `sub` (Subject ID) as the primary identifier and requests `user.birthday.read` for age verification. It then queries the YouTube API (mocked for prototype) to assign a **User Status**:

- **Guest:** Verified via Google SSO. Can redeem exactly **one standard coupon** system-wide. All other coupons show "Teaser" status.
    
- **Subscriber:** Unlimited access to "Standard" coupons ($3 fee to partner).
    
- **Premium Member:** Access to **all** coupons (Standard + Premium) ($5 fee to partner) + "I'm Feeling Lucky" recommendations.
    

### B. The "Smart" Onboarding (Taste Map)

Users establish their profile through a tiered quiz designed for ease:

1. **Core Quiz (3 Questions):** Captures broad preferences (Coffee, Snacks, Vibe).
    
2. **The Decision Gate:** User chooses to "Start Exploring" or "Fine-Tune" (proceed to 4 more questions: Fruit, Toast, Carbonation, Bitterness).
    
3. **The Profile:** Results are stored as a **Taste Vector** (numerical scores for Roast, Bitter, Sweet, Fruity, etc.).
    

### C. The Recommendation Engine

- **Partner Locations:** Pulls from a "Location List" (curated by staff from the Master Catalog). Users can optionally toggle a **Bartender Script** to appear alongside specific matches.
    
- **Non-Partner Locations:** Uses geo-fencing to detect a non-partner venue and provides a **"Beer Phrase"** (a script the user can read to the waiter) plus examples from the Master Catalog.
    
- **The Slider:** A UI element allowing users to toggle between "Comfort Zone" and "Adventure Mode."
    
- **Location Discovery (New):** A map-based view allowing users to find nearby bars with active promotions or beers matching their profile, using the app's location selector to mock GPS presence.
    

---

## 3. Business Operations & Anti-Fraud

### A. The "Smart QR" Redemption

To solve the "Shareable Paradox" (static screenshots vs. live app), the system uses a **Timestamped Signature**:

- **Live Check:** If the scanned QR is $>30$ seconds old, the Staff UI flags it as a "Static Image." To minimize false positives, the user's app automatically refreshes the QR every **30 seconds**.
    
- **Verification Redirect:** Stale codes prompt the user to scan with their native camera to reach the verified `/redeem` landing page. Once verified via Google SSO, a new identity-linked QR is generated. Staff scan this new QR to automatically credit conversions and skip manual forms. Validations are strictly scoped to the specific **Promotion + Location + User** combination, allowing users to enjoy the same loyalty benefits at different participating venues. Every redemption (Live or Verified Guest) requires a **Bill ID**.
    

### B. Staff & Management Ecosystem

- **Staff Rewards:** Bartenders/Waiters track "Guest-to-Member" conversions. After a set threshold (placeholder), they receive a reward.
    
- **Manager View:** A financial dashboard showing active promotions and total "Billable Fees" based on tier-specific redemptions ($3 vs $5).
    
- **Super-Admin View:** Global control over the **Master Catalog**, Community Suggestions, Location Management, and Fee Configuration.

> [!TIP]
> **Effective Role Logic**: The system automatically downgrades staff permissions to 'subscriber' if they are outside their assigned Location or Group scope, ensuring regional data isolation.
    

---

## 4. Database & Data Architecture (Edge Optimized)

- **Master Catalog & Breweries**: Centralized database of beers and their producers. Each brewery is registered with its origin to ensure data consistency across the ecosystem.
    
- **Interaction Log:** Records "Recommendations Offered" vs. "Beers Consumed" to refine the Taste Map via the **Tiered Feedback Loop** (Loved/Liked/Not my beer).
    
- **Billing Ledger:** Immutable log of redemptions for monthly invoicing.
    

---

## 5. Prototype "Fake" vs. "Real" Matrix

|**Feature**|**Prototype Implementation**|**Production Target**|
|---|---|---|
|**Auth**|NextAuth.js (Google SSO format, mocked profiles, selectable via a dropdown)|Real YouTube Data API|
|**Geo-Fencing**|Manual Location Selector (SMA/CDMX)|Google Business/Maps API|
|**QR Scan**|Button to simulate camera scan|Live Camera Stream|
|**Database**|JSON / Cloudflare D1 Mock|Persistent SQL Database|
