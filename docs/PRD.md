# Product Requirements Document (PRD) — Prototype Edition
**Project:** CDMX Beer Discovery & Loyalty System
**Market:** Mexico City (CDMX)

---

## 1. Project Overview

* **Name:** Atlalli Prototype
* **Goal:** A web-app prototype to manage restaurant/bar coupons and build user "Taste Maps" via content-gated loyalty. The app acts as a digital bridge between YouTube content and physical consumption at bars/restaurants, using a "Taste Map" to drive user engagement and a tiered billing system for B2B partners.
* **Tech Stack:** 
  - Next.js 14+ (App Router) with TypeScript
  - Tailwind CSS (styling)
  - Zustand (state management)
  - next-intl (internationalization: ES-MX, EN-US)
  - Recharts (5-axis radar charts)
  - qrcode.react (QR code generation)
  - jose (JWE/HMAC-SHA256 cryptography)
  - Lucide React (icons)
* **Deployment Target:** Cloudflare Pages (Edge Runtime for easy mobile testing via URL).

---

## 2. Core Features

### 2.0. **Multi-language:** The app will be multi-language, initially supporting both Mexican Spanish (ES-MX) and English (EN-US) for content and UI using next-intl.

### 2.1. **YouTube Integration:** Automated tier-leveling based on channel subscription and membership status (mocked for prototype).
  - **Simulated Login:** Role-based entry (Minor, Anonymous, Guest, Subscriber, Premium, Bartender, Manager, Super-Admin).
    
### 2.2. **Dual-Mode Recommender:** 
  - _At Sponsor:_ Suggests specific brands based on real-time tap-list.
  - _At Prospect:_ Suggests descriptive sensory profiles (BJCP-aligned) for users to ask bartenders.
  - **Recommendation Engine:** 5-axis matching with tiered $N$ evolution ($N=5$ for Love, $N=10$ for Like, $N=20$ for Dislike).
  - **Sensory Cold Start/Initial Quiz:** A 3-level choice (Skip / 3-Question Quick / 10-Question Deep) initializing a 5-axis profile.
  - **Recommendation UI:**  
	- A **Similarity Slider** ( = "Safe/My Taste" to  = "I'm Feeling Lucky/Adventure").
  - **Partner Locations:** Recommendations include specific beer names. Users can optionally toggle a **Bartender Script** to appear alongside these matches.
  - **Non-Partner Locations:** Displays a **"Beer Phrase"** (e.g., *"Ask for a crisp, citrusy IPA with low bitterness"*) as the primary recommendation.
        
### 2.3. **Verified Redemption Journey:** QR codes use a dual-function URL logic. If scanned by a native camera, users are routed to a verified `/redeem` landing page featuring:
  - **Identity Gate:** Mandatory alcohol disclaimer and identity check before showing rewards.
  - **Google SSO Verification:** Automated age (18+) and redemption limit checks.
  - **Location-Scoped Validation:** Redemptions are strictly scoped to the combination of (Promotion + Location + User). This allows users to redeem the same promotion at multiple physical locations while preventing double-redemption at any single venue.
  - **Live Refreshing QR:** Eligible guests receive a new signed QR that auto-refreshes every 30 seconds, using their verified email as the identifier.
- **Staff Scanner Automation:** Detects verified email identifiers in QRs, automatically sets guest mode, and skips all manual entry for a zero-friction bartender experience.
- **Detailed Error Reporting (Prototype):** The redemption interface provides descriptive error messages (instead of generic "Error") to facilitate rapid debugging during prototype testing.

### 2.4. **Discovery Map:** Mocked GPS location selection (Sponsor vs. Prospect vs. None).

### 2.5. **Bartender Portal:** A secure "Workspace" for validating coupons, entering guest emails, and tracking personal conversion rewards.
  - **Privacy-First Redemption:** Signed QR validation with no PII shown to Bartenders.

### 2.6. The Feedback Loop & Catalog Growth
- **"Rate a Drink" Interface**: High-density beer search with "Netflix-style" feedback:
    - **Loved it**: Fast profile adaptation ($N=5$).
    - **Liked it**: Standard profile adaptation ($N=10$).
    - **Not my beer**: Avoidance logic ($N=20$) to refine the flavor map.
- **Community Contributions**: Users can suggest missing beers directly from the rating flow.
- **Unified Catalog Admin**: A dedicated portal for Super-Admins to manage catalog growth.
    - **Consolidated Browse**: View system items and user suggestions in a single, filterable view.
    - **Technical Mapping & Verification**: Approve suggestions by mapping them to BJCP styles and adjusting sensory vectors.
    - **Brewery Management**: A dedicated catalog for managing breweries globally, ensuring data consistency across beers.
    - **Advanced Editing**: Modify brand names, brewery associations, and apply sensory overrides with a simple toggle interface.
    - **Soft-Delete with Undo**: 7-day window for restoring removed catalog items.
- **Centralized Message Center:** A notification hub in the Navbar for users to receive system alerts and admin feedback.
- **"Reset Data" Simulator Tool:** A specialized developer/tester option in the Navbar allows for immediate clearing of the Zustand store and `localStorage`. This resets the "Taste Map", User Role, and Location history, enabling testers to restart a journey on physical mobile devices without using desktop developer tools.

### 2.7. **Manager Dashboard (Operations):**
- **Performance Analytics**: Track active promotions and redemption volumes.
- **Monthly Redemption Ledger**: A sortable/filterable table (Period, Tier, Promotion) showing monthly redemption counts for auditing.
- **Role-Gated Access**: Restricted to `manager` and `super_admin` roles.

### 2.8. **Semantic Theme System (Luxe UI):**
- **Obsidian Night**: The default high-contrast dark mode for low-light environments.
- **Luxe Light Mode**: A refined ivory and gold theme for high-visibility daytime use.
- **High-Density Mobile Design:** Utilizes the `dark-card` design token for mobile drawers and location lists. UI elements (headers, paddings, and font sizes) are programmatically reduced on mobile (`h-fit` menus, `text-lg` headings) to ensure maximum focus on content while maintaining a premium feel.
- **Deterministic Legibility**: Automatic switching of map tiles and CSS variables to ensure perfect readability in both modes.

### 2.9. **Location Discovery (Places Suggestion):** 
+  - **Tabbed Recommendation View:** Users can toggle between "Recommended Beers" and "Recommended Locations".
+  - **Interactive Map:** Integrated Leaflet map showing nearby partner venues.
+  - **Discovery Radius:** A slider (500m to 10km) allowing users to expand or narrow their search.
+  - **Smart Filtering:** Locations are sorted by distance and prioritized by active tier-specific promotions.
+  - **Coordinate Mocking:** The system uses the coordinates from the active "Location Selector" selection to mock GPS data for the prototype.

---

## 3. User Roles (Mocked Authentication)

Since we are faking the YouTube API for this stage, the login screen will feature a **"Persona Selector"** simulating the following roles for testing:

1. **Anonymous:** No login. Can see locations and coupons but cannot "claim" coupons.
2. **Guest:** Google SSO verified. Can redeem exactly **one standard coupon** across the entire system.
3. **Subscriber:** Simulates a YouTube Subscriber. Can claim unlimited "Standard" coupons (1 per promotion per location).
4. **Premium Member:** Simulates a paid YouTube Member. Access to all coupons (**Standard + Premium**) + deeper Taste Map tools.
5. **Staff/Bartender:** Access to the QR Scanner and "Guest Conversion" tool.
6. **Super-Admin:** Access to the Master Catalog and Reward Dashboard.

| **Role**        | **Access Level**        | **Key Functions**                                                      | **Notes**                                                          |
| --------------- | ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Minor**       | Unauthenticated         | Access Denied                                                          | Verified at login and /redeem landing page (age <18).              |
| **Guest**       | Google SSO (Verified)   | 1x Total Redemption (Standard), Live Identity QR.      | Limited to one total drink system-wide.               |
| **Subscriber**  | YouTube Auth (Standard) | Claim Standard Coupons, Basic Taste Map.               | Per-promo limit. Verified by Google SSO.              |
| **Premium**     | YouTube Auth (Member)   | Claim All Coupons (Standard + Premium), Enhanced Map.  | Per-promo limit. Verified by Google SSO.              |
| **Staff**       | Context-Aware           | Scanner UI, Automated Identification.                      | Active only in assigned scope (Location/Group).    |
| **Manager**     | Context-Aware           | Operations Dashboard, Monthly Audit Reports, Promo Performance. | Active only in assigned scope (Location/Group).    |
| **Super-Admin** | Global                  | Master Catalog & Brewery Admin, Technical Mapping, Messaging. | Global audit of verified conversions.              |

---

## 5. Business Logic

- **Multi-language:** The app will feature a language selector on the top-right corner of the nav-bar, allowing users to switch between Mexican Spanish (ES-MX) and English (EN-US) for content and UI. The default value will be defined by the browser's language. If the browser's language is not spanish nor english, the default will be English.

- **The N=10 Rule:** Profiles evolve based on $T_{new} = T_{old} + (Input - T_{old}) / N$.

- **Verified Guest Redemption Logic:** Guests must verify their identity via Google SSO on the `/redeem` landing page before a redemption QR is generated.
	- **Identity Check:** Verify age (18+) and email-based redemption limit (scoped by Location and Promotion).
	- **Limit Persistence:** If a guest has already redeemed (1 total system limit), they are shown a **tier-specific conversion prompt** on their own device and all coupons are locked.
	- **Staff Automation:** Once a guest is verified, their live QR contains their email. The scanner automatically attributes the conversion to the scanning bartender without manual typing.

- **Audit Requirement:** All redemptions require a manual "Bill ID" entry.

- **The Recommendation Logic:**    

    - **Partner Bar:** Picks 3 beers from the _Location-Specific List_ that match the user's Taste Map + Similarity Slider. In Discovery Mode, users see these bars highlighted on a map with distance sorting.
    
    - **Non-Partner Bar:** Provides a **"Beer Phrase"** (e.g., _"Ask for a roasty, full-bodied Stout"_) + examples (e.g., _"Like a Lagrimas Negras"_).
    
    - **Sensory Logic:** The core logic treats beer and users' profiles as 5-dimensional vectors, with values from 0.0 to 1.0.
      1. **Bitterness:** (Clean/Crisp $\leftrightarrow$ Sharp/Aggressive)
    
      2. **Malt:** (Bread-like $\leftrightarrow$ Coffee/Roasted)
    
      3. **Body:** (Light/Easy $\leftrightarrow$ Heavy/Creamy)
    
      4. **Aromatics:** (Floral/Fruity $\leftrightarrow$ Earthy/Funk)
    
      5. **ABV:** (Sessionable $\leftrightarrow$ Intense/Warming)
    
    - **Cold Start:** Users choose between a **Sensory Survey** (answering everyday flavor questions) or selecting a list of **Known Beers** they like.
    
    - **Evolution:** The profile updates using a tiered weighted moving average. "Loved it" ($N=5$) pulls the map strongly toward the beer, "Liked it" ($N=10$) is the benchmark, and "Not my beer" ($N=20$) shifts the profile away from that sensory zone.
    
    - **Discovery Mode:** The "Similarity Slider" allows in the vector to suggest styles "adjacent" to current favorites.


- **The "Taste Map": Engine:** The system treats every beer and every user as a point in a 5-dimensional sensory space.

  - **Weight Evolution Algorithm:** Every user interaction (Like/Dislike) triggers a profile update using an equal-weight moving average:
  
    $T_{new} = T_{old} + {(Input - T_{old})} / {N}$
  
  This ensures that the user's "center of taste" shifts gradually, preventing the algorithm from becoming too niche too quickly.

  - **Proximity Matching:**

    - **Direct Match:** The system calculates the Euclidean distance between the user’s `taste_vector` and the `tap_list` vectors of the current Sponsor bar. The closest $k$ beers are recommended.
    
    - **Descriptive Match (Prospect):** If at a non-sponsor, the system finds the closest **BJCP Style** and translates its vector into the **Conversational Dictionary** (e.g., "Dark and Toasty" instead of "Malt-forward Stout").

- **QR Security & Dual-Function Routing:**
    - **Dynamic Generation:** App QRs refresh every **30 seconds** using **jose** signed payloads.
    - **Configurable Landing Page:** The base URL for redemption can be centrally managed in `src/data/system_config.json` via the `base_url` parameter (defaults to the current domain if empty).
    - **St screenshot Detection:** Stale or static codes trigger an error directing the user to scan with their native camera to initiate the **Verified Redemption Flow** at `/[locale]/redeem`.
    - **Audit Key:** A manual **Bill ID** entry is required for every redemption. This allows sponsors to cross-reference redemptions with their POS systems.
      
---

## 6. Core Technical Modules

### 6.1. The Master Catalog & Local Inventory

- **Master Catalog:** A global database of beers. Each entry includes: _Name, Brand, Style (IPA, Stout, etc.), and Taste Variables (Bitterness, Body, Sweetness, Aroma)._
  - Initial data for the catalog is found at src/data/catalog.json and should be loaded during the initialization phase.
    
- **Location-Specific List:** Staff/Managers perform a "one-time big effort" to select beers from the Master Catalog available at their venue.

- **Verification Journey:** Coupons generate a URL-embedded QR: `atlalli.app/redeem?d=[Signed_Payload]`.
    
- **Validation:** Staff scan verifies signature and freshness. If stale, the user is redirected to the verified landing page.
    
- **Automated Conversion:** Verified guests provide their email via SSO. The scanner identifies the email in the payload, credits the staff ID automatically, and skips manual forms.
    
### 6.3. The Feedback & Taste Map Loop

- **Pending Feedback:** A badge counts "Open Recommendations."
    
- **Interaction:** Users confirm which of the 3 recommended beers they drank (or enter a manual one) and provide a Thumbs Up/Down.
    
- **The Slider:** Users adjust their recommendation "Radius":
    
    - **0-30%:** "Stay in my comfort zone."
    
    - **31-70%:** "Something new but familiar."
    
    - **71-100%:** "Surprise me/I'm feeling lucky."
    
### 6.4. B2B Management & Billing

- **Management Dashboard:** Managers view active vs. expired coupons and redemption counts.
    
- **Bartender View:** Simple counter: `Converted Guests: 5 / Goal: 10`.
    
- **Staff Performance (Super-Admin Only):** A leaderboard of staff "Guest-to-Member" conversions to facilitate monthly reward deliveries.
    
- **Billing View (Audit Ready):**
	- Standard Coupon Redemptions × **$3 USD** (Configurable).
    - Premium Coupon Redemptions × **$5 USD** (Configurable).
    
- **Super-Admin View:** A table showing each location and the "Rewards Due" for the staff based on successful guest-to-member conversions.

---

## 7. Technical Specifications & Schemas

### 7.1 Data Schema Highlights

- **`BJCP_Dictionary`:** Internal technical ranges (ABV, IBU) mapped to **Conversational Dictionary** keys (e.g., "Crisp" / "Refrescante").
  - **Seeding:** Data for the `BJCP_Dictionary` is available from init/bjcp_dictionary.json and should be loaded during the initialization phase.
    
  - **Matching:** When a user's `taste_vector` is calculated, the system performs a **Nearest Neighbor** search against the `sensory_vector` values in this dictionary.
    
  - **Fallback:** If a specific brand (e.g., "Piedra Negra") is not found in the `Master_Catalog`, the system falls back to the `sensory_vector` of the style it belongs to (e.g., `13C - English Porter`).

    
- **`Shadow_Analytics`:** Anonymized logs for Prospect bars (Place_ID + Style + Time) with **User_ID stripped** for privacy compliance.
    
    
---

## 7. Operational Guardrails

- **Localization:** Browser detection for **Spanish (LATAM)** and **English (US)** with user-manual overrides.
    
- **Security:** Cryptographic non-repudiation for QR redemptions ensures invoices cannot be legally disputed by sponsors.
    
- **Privacy:** No background geofencing; location data is only processed upon user-triggered recommendation or redemption requests.
    


## 8. Deployment & Technical Constraints

- **Hosting:** Cloudflare Pages (Next.js App Router).
    
- **Runtime:** **Edge Runtime** (`export const runtime = 'edge'`).
	
- **State:** Zustand (TypeScript)
	
- **Internationalization:** next-intl (ES-MX, EN-US)
	
- **Charts:** Recharts
	
- **QR Generation:** qrcode.react
	
- **Cryptography:** jose (JWE/HMAC-SHA256)
    
- **Database:** Cloudflare D1 (Mocked for Prototype).
    
- **Styling:** Tailwind CSS (Mobile-first).

---

## 9. Prototype "Mock" Scope

To facilitate testing of various business rules without multiple devices or actual Google SSO:

1. **Auth:** "Login" actions are mocked via `users.json`. The `/redeem` landing page features a **Persona Selector Modal** to switch between Guest, Minor, Subscriber, and Premium roles for scenario validation.
    
2. **Geo-Fencing:** A "Select My Location" dropdown with hardcoded San Miguel de Allende and CDMX venues.
