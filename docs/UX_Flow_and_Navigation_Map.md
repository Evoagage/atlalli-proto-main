---

Tech Stack: Next.js (App Router), Tailwind CSS
Environment: Cloudflare Pages (Frontend-Only)
Simulation Strategy: Global Context for Role & Location Mocking

---

## 1. Prototype Authentication & Entry Logic

### 1.1. Mobile Navigation (Hierarchical)
To avoid clutter on mobile devices, the Navbar uses a hierarchical drawer system:
- **Primary Drawer**: 
    - **Location Option**: Opens the **Location Sub-menu**.
    - **Options Option**: Opens the **Navigation Sub-menu**.
- **Location Sub-menu**: Context-aware Location Selector using the **Dark Card** approach for high-density list visibility.
- **Navigation Sub-menu**: Dynamic links based on user role + a **Reset Data** option at the bottom.

### 1.2. Profile & Notification Hub
Accessible via the persistent User Icon in the Navbar:
- **Profile Card**: Displays user name, role, and membership status.
- **Theme Toggle**: Real-time switch between "Obsidian Night" and "Luxe Light".
- **Language Selector**: Rapid switch between English/Spanish.
- **Message Center**: A dedicated drawer for reviewing admin feedback.
- **Reset Data**: Global reset of all local state and preferences.

### 1.3 The Simulated Login Page

Instead of a username/password, the landing page features the **Role Selector Dropdown**. Selecting a role executes a mock API call that returns a user object and redirects to the appropriate dashboard.

|**Role Option**|**Simulated Logic / Response**|**Target View**|
|---|---|---|
|**Minor (Age < 18)**|`YouTube_API` returns `age: 17`. Login rejected.|Error: "Access Restricted"|
|**Anonymous**|`isLoggedIn: false`. No persistent vector.|Discovery Map (Public)|
|**Guest (Verified)**|`role: "guest"`.|Map + 1x System Redemption (Standard)|
|**Subscriber**|`role: "subscriber"`.|Map + All Standard Coupons|
|**Premium (Member)**|`role: "premium"`.|Map + All Coupons (Std + Prem)|
|**Bartender**|`role: "bartender"`. Scoped.|Bartender Workspace (Verified Only)|
|**Manager**|`role: "manager"`. Scoped.|Manager Dashboard (Aggregated)|

> [!IMPORTANT]
> **Scoped Visibility**: In the prototype, staff personas (Alice Manager, Bob Bartender, Group Managers) are tied to specific locations/groups. If the "Global Location Selector" is set outside their scope, management links automatically hide.

---

## 2. The Global Environment Controller

To test the "Context-Aware" logic without a live GPS or Backend, the prototype must implement a **Floating Environment Controller** available in the UI (e.g., a small gear icon in the corner).

### 2.1 Global Location Selector

This replaces the GPS API. Changing this selection forces the app to re-evaluate the "Nearby" logic.

- **Location A (Sponsor 1):** _Cielito Lindo Roma_ (Inventory: Hércules, Morenos).
    
- **Location B (Sponsor 2):** _Cru Cru Taproom_ (Inventory: Cru Cru, Colima).
    
- **Location C (Prospect):** _Generic Bar Condesa_ (Non-Sponsor; triggers Sensory Script).
    
- **Location D (Out of Range):** No bar detected; triggers "Discovery Mode."
    

---

## 3. Navigation Map by Persona

### 3.1 Consumer Path (Explorer Mode)

- **Home (Discovery):**
    - **Header/Hero CTA:** "Find my Match" or "Build my Map".
    - **Cold Start (`sampleCount == 0`):**
        - Triggers **Discovery Quiz Overlay**.
        - **Step 0:** Familiarity Gate (New to Craft | Occasional | Connoisseur).
        - **Path A (New):** 4-5 Analogous flavor questions (Coffee, Fruit, Chocolate).
        - **Path B (Occasional):** 4 Archetypal Beer Style cards (Lager, IPA, etc.).
        - **Path C (Connoisseur):** Direct control of the Radar Chart.
    - **Active Recommendation:**
        - Displayed inline once `sampleCount > 0`.
        - **Similarity Slider:** User adjusts from "Comfort" to "Adventure".
        - Returns 3 cards (Matching Beers or Beer Phrase).
    - **Location-Aware Logic:**
        - If **Sponsor Venue**: Display specific labels from inventory.
        - If **Prospect Venue**: Display "Beer Phrase" script.
- **Taste Profile:**
    
    - Radar Chart (Tailwind/SVG) showing current user vector.
        
    - Update buttons to simulate "Likes/Dislikes" and observe $N=10$ evolution logic.
        
- **Wallet:**
    
    - Mocked list of QR Coupons. "Redeem" button generates a dual-function QR.
    
- **Redemption Landing Page (`/redeem`):**
    - High-polish entry point for external camera scans.
    - Features progressive disclosure: Alcohol Disclaimer $\rightarrow$ Identity Verification (SSO) $\rightarrow$ Live Refreshing QR.
    - Performs age checks and guest redemption limit validation.    
6. **Scan Process:**
   - **Happy Path:** Bartender scans $\rightarrow$ Instant validation $\rightarrow$ Enter **Bill ID** $\rightarrow$ Success.
   - **Error Path:** Static image detected $\rightarrow$ **Verified Redemption Redirect**: User scans via native camera $\rightarrow$ Lands on `/[locale]/redeem` $\rightarrow$ Persona Selection (Mock) $\rightarrow$ Verified Identity QR $\rightarrow$ Staff Scans again.
 redemption limit validation.    

### 3.2 Staff Path (The Workspace)

- **Scanner Screen:**
    
    - **Automated Identification:** Detects verified emails in QR payloads. 
    - **Logic:** For verified guests, the system automatically marks the conversion and proceeds to the **Bill ID** entry. All manual typing is eliminated.
    
- **Redemption Modal:**
    
    - Privacy-First UI (Masked identifiers).
    - Numerical Input for **Bill ID** (Mandatory).
    - Amber Sync Pulse animation.

### 3.3 Admin Path (Universal Control)

- **Admin Dashboard**:
    - Accessible only to 'super_admin'.
    - **Master Catalog Suggestions**: Centralized management of user-submitted beers.
    - **System Insights**: Global conversion data.
        

---

## 4. Key Interaction Logic (For AI Implementation)

### 4.1 The "Privacy-First" Validation Handshake

1. **Tester** (as Premium User) clicks "Redeem" $\rightarrow$ UI shows QR + Amber border.
    
2. **Tester** (switches to Bartender) clicks "Simulate Scan" $\rightarrow$ Screen pulses Amber.
    
3. **UI Verification:** AI must ensure only `Tier` and `Masked ID` are visible to the Bartender.
    

### 4.2 Recommendation Fallback Script

1. Set Global Location to **Location C (Prospect)**.
    
2. Click "Find Beer".
    
3. AI should generate the template: _"Ask for something [BODY] that is [MALT] with [AROMATICS]."_ based on the active User Role's taste vector.
    

---

## 5. Prototype Data Anchors

Antigravity should use the following mocked objects for internal state:

JavaScript

```
// Mock Location Data for Antigravity
const PROTOTYPE_LOCATIONS = [
  { id: 'loc_a', name: 'Cielito Lindo', type: 'sponsor', inventory: ['hercules_republica', 'morenos_manguito'] },
  { id: 'loc_b', name: 'Cru Cru Tap', type: 'sponsor', inventory: ['cru_cru_lager', 'colima_paramo'] },
  { id: 'loc_c', name: 'Generic Pub', type: 'prospect', inventory: [] },
  { id: 'loc_d', name: 'Street View', type: 'none', inventory: [] }
];
```
