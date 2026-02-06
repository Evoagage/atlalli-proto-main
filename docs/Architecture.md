# Technical Architecture & Structural Integrity
**Stack:** Next.js (App Router), Tailwind CSS, Zustand (State).

## Folder Structure (Strict Compliance Required)
- `/src/app/[locale]`: Routing and UI Pages (.tsx files with App Router, localized).
  - `/admin`: [NEW] Super-Admin exclusive zone.
  - `/manager`: Manager-scoped promotions and reports.
- `/src/app/api/auth/[...nextauth]`: NextAuth.js configuration for Google SSO.
- `/src/app/layout.tsx`: Root layout (handles edge runtime and global config).
- `/src/middleware.ts`: next-intl middleware for locale detection and redirection.
- `/src/components`: Atomic UI components (Buttons, Radar Chart, Cards) (.tsx files). Includes dynamic imports for Map components.
- `/src/store/useStore.ts`: Single source of truth for global state (Zustand with TypeScript).
- `/src/data`: JSON files for beer and style data.
  - `catalog.json`: Master beer catalog
  - `bjcp_dictionary.json`: BJCP style sensory vectors
  - `locations.json`: Prototype location data (4 test locations)
  - `system_config.json`: System-wide configuration (N=10, billing fees, etc.)
  - `users.json`: Mock Google Profiles (Subject IDs, birthdates)
  - `coupons.json`: Promotion metadata and tier info
  - `venue_secrets.json`: Mock Venue Private Keys for HMAC signatures
- `/src/utils`: Mathematical formulas and string generators (.ts files).
  - `beerMath.ts`: N=10 evolution formula, Euclidean distance calculations, beer matching algorithms, vector validation
  - `lexical.ts`: Conversational dictionary mapping, beer phrase generator
  - `auth.ts`: [NEW] Scoped role resolution logic (`getEffectiveRole`).
- `/src/actions`: [NEW] Server Actions for secure operations (QR Signing, Redemption Validation).
- `/src/lib/auth.ts`: [NEW] NextAuth.js configuration and helpers.
- `/messages`: i18n translation files (en-US.json, es-MX.json).

## Internationalization (i18n) Governance
- **Zero Hardcoded Strings**: All user-facing text MUST live in `/messages/*.json`. 
- **Consistency**: Keys should be camelCase and organized by component or feature (e.g., `qr.expiresIn`, `auth.login`).
- **Parametrization**: Use `next-intl` interpolation for dynamic data (e.g., `{venue}`, `{seconds}`).
- **Fallback**: Always provide translations for both `en-US` and `es-MX`.

## Global State Management (Zustand + TypeScript)
- Store MUST manage: `session`, `userRole`, `currentLocation`, `tasteVector`, `sampleCount`, `locale`, `showBartenderScript`, `discoveryRadius`, `theme`, `notifications`, `redemptionRecords`, `resetAll`.
- **Theme Awareness**: Persistence of `theme` (dark/light) in the store, driving semantic CSS variables and map tile logic.
- **Role Scoping**: Roles are resolved dynamically via `getEffectiveRole`. If a privileged user (Manager/Bartender) is outside their `scope` (Location or Group), they revert to `subscriber` status.
- Role changes must persist across the session.
- Location changes must trigger immediate re-matching of nearby beers.
- Locale changes must trigger UI re-render with next-intl (use `setRequestLocale` in layouts and `await requestLocale` in config).
- All state must be strongly typed with TypeScript interfaces.

## Design Tokens (Semantic System)

The system uses **Semantic CSS Variables** to enable seamless theme switching between **Obsidian Night** and **Luxe Light**.

### Core Palette
- **Primary (App Background):** 
    - _Obsidian:_ `#0D0D0D` (Deep matte black)
    - _Luxe:_ `#F2F1ED` (Warm bone/ivory)
- **Accents (Dual-Tone identity):** 
    - **Liquid Gold** (`#D4AF37`): Primary CTA, Pin borders, active states.
    - **Agave Blue** (`#72C7E7`): Logo water glyph, Premium tier highlights.
- **Text:** 
    - _Obsidian:_ Bone White (`#F5F5F2`) for readability.
    - _Luxe:_ Obsidian Black (`#1A1A1A`) for contrast.

### UI Techniques
- **Glassmorphism**: Semi-transparent cards (`glass-card`) use `backdrop-blur-md` and adaptive border opacities.
- **Dark Card Design**: For high-density mobile menus (like the Location Selector), a solid `dark-card` with higher opacity and defined borders is preferred over glassmorphism to ensure maximum readability.
- **Mobile-First Optimizations**: The UI dynamically scales for smaller screens:
    - **Compact Headers**: Reduced padding and font sizes (`text-lg` titles).
    - **Tailored Drawers**: Mobile menus use `h-fit` to avoid vertical overflow and have reduced item spacing.
    - **Responsive Typography**: Font sizes for titles and key labels (e.g., labels, coupon titles) use responsive Tailwind breakpoints (e.g., `text-lg lg:text-xl`).
- **Micro-animations**: Theme-aware logo transitions and loading bars using the gold-glow shadow.

## QR Redemption Security (The "Invoicing Shield")

The system uses **HMAC-SHA256 signatures** validated via **Server Actions** to ensure that redemptions are authentic and non-repudiable. Venue Private Keys are stored server-side and never exposed to the client. Actions are strictly designed for **Edge Runtime Compatibility** (using `TextEncoder` and `jose` base64url utilities instead of Node.js `Buffer`).

### QR Data Packet Structure

Every dynamic QR generated in the app contains a payload signed with **HMAC-SHA256** using the **jose** library:

- `p_id`: Promotion ID.
    
- `s_id`: Sponsor/Bar ID.

- `u_id`: User Subject ID or verified email address (for guests).
    
- `ts`: Timestamp (Unix seconds).
    
- `nonce`: Random 16-character string.
    
- `sig`: Cryptographic signature of the above fields using the **Venue Private Key**.
    
### The Redemption Handshake

  1. **Scan:** Bartender scans the QR.

  2. **Validation:**
    
    - **Integrity:** App verifies the `sig` matches the data using `verifyCoupon`.
    
    - **Staleness:** If `ts` > 30 seconds ago (or `qrRefreshRate`), it is rejected as a **Screenshot**. 
    
    - **Native Redirect:** Stale scans direct the user to the `/redeem` verified landing page via native camera scan.
    
  3. **Automated Identification & Scoped Check:** Verify if `u_id` is an email. Check the redemption ledger for a match on the specific **Promotion + Location + User** combination. If both pass, apply guest conversion rules and skip manual identification forms.
    
  4. **Commit:** A manual `bill_id` is entered, and the record is written to the immutable ledger.
    
## Data Privacy & Anonymization

Following GDPR and local CDMX data laws, we prioritize **Anonymized Shadow Tracking**.

### Prospect Bar Tracking (Non-Sponsors)

When a user triggers a recommendation at a non-sponsor bar (Prospect):

- **Input:** User GPS + Action (e.g., "Find Beer").
    
- **Output:** The app identifies the bar via Google Places.
    
- **Storage:** A record is created in `/market_telemetry` containing `{ style_id, bar_place_id, timestamp, neighborhood }`.
    
- **Anonymization:** The `user_uid` is **never stored** in this collection. It is purely aggregate marketing data for future sponsor deals.
    

---

## SuperAdmin Portal Security

The **SuperAdmin Portal** is the highest security zone.

- **Seeding:** Initial catalogs and admin emails are loaded via a Node.js script into the `/system_admins` collection.
    
- **Actions:** SuperAdmins can manage the `BJCP_Dictionary`, register new `Sponsors`, and perform global audits.
    
- **IP Restriction:** (Recommended) Cloud Functions for Admin tasks are restricted to specific IP ranges or require **Multi-Factor Authentication (MFA)**.
    

---

## Operational Guardrails (Summary Table)

|**Threat**|**System Defense**|
|---|---|
|**Coupon Fraud**|Dynamic QRs + JWE Signature + 30s expiration.|
|**Invoicing Dispute**|Mandatory `bill_id` + Immutable redemption ledger.|
|**Profile Bias**|Tiered Moving Average ($N=5, 10, 20$) prevents rapid polarization while allowing faster learning from high-intent ratings.|
