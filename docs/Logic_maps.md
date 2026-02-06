## 1. Authentication & Tier Logic Flow

This flow governs how the YouTube API dictates the user's experience.

1. **Entry Point:** User lands on the Web App (Guest State).
    
2. **Action:** User clicks "Login with Google."
    
3. **Authentication (Mocked for Prototype):** * System checks `Subscription_Status` and `Membership_Level`.
    
    - **Logic Gate 1:** Is User a Subscriber?
        
        - _Yes:_ Unlock "Standard" Coupons.
            
        - _No:_ Show "Subscribe to Unlock" CTA.
            
    - **Logic Gate 2:** Is User a Paid Member?
        
        - _Yes:_ Unlock **Premium** Coupons (plus Standard) + "I'm Feeling Lucky" Slider.
            
        - _No:_ Show "Go Premium" CTA on premium offers.

4.  **Role Normalization**: 
    - Determine `EffectiveRole` using `getEffectiveRole(session, currentLocation)`.
    - If user is "out of scope" (e.g. Manager at a Bar they don't manage), they are downgraded to `subscriber` status.

5.  **Redirect**: To `/` or the last intended path.
            

---

## 2. Recommendation Engine Logic (The "Cicerone" Map)

This ensures the AI knows when to provide specific beers versus the "Beer Phrase."

1. **Trigger:** User clicks "Get Recommendation" at a location.
    
2. **Location Check (Mocked Geo-fence):**
    
    - **Case A: Partner Location found.**
        
        - System pulls `Location_Beer_List`.
            
        - Matches list against `User_Taste_Profile`.
            
        - Applies `Similarity_Slider` % (Safety vs. Adventure).
            
        - **Output:** 3 Specific Beers + "Manual Entry" button.
        - **UI Enhancement:** Users can optionally include the **Bartender Script** alongside specific beer recommendations.
            
    - **Case B: Non-Partner/No Location found.**
        
        - System pulls `User_Taste_Profile`.
            
        - Generates **Beer Phrase** (e.g., "Dark, Roasty, Heavy Body").
            
        - Appends examples from **Master Catalog** (e.g., "Like a Guinness or Minerva Stout").
            
        - **Output:** Beer Phrase + Examples.
        - **UI Note:** The "Include Bartender Script" toggle is hidden here as the script is the primary output.
            

---

## 3. The "Smart QR" Redemption Sequence

This is the core anti-fraud and guest-conversion logic.


1. **Customer Side:** Generates QR code. The payload is: `{User_ID, Coupon_ID, Timestamp: Date.now()}`.
    *   **Auto-Refresh Logic:** The web app automatically regenerates the QR code every **29 seconds** to ensure it remains valid for a live scan while the user is on the page.
    
2. **Staff Side:** Scans QR code.
    
3. **Validation Logic (The "Anti-Screenshot" Gate):**
    
    - **Is `Scan_Time` - `QR_Timestamp` < 30 seconds?**
        
        - **YES:** Check database for `Single_Use_Token`.
            
            - _First time (for this User + Promotion + Location):_ Success. Mark as "Redeemed."
                
            - _Already used:_ Show "Coupon Already Redeemed" error.
                
        - **NO:** Flag as "Static Image."
            - Trigger **Verified Redemption Flow**: Visit `/redeem` $\rightarrow$ User verifies age/identity $\rightarrow$ System checks for 1x system-wide guest limit $\rightarrow$ Generates live identity QR.

    - **Invoicing Gate:** For every successful scan (Live or Verified Guest), the staff UI **mandates** a **Bill ID** entry to link the redemption to the venue's internal sale for reward billing.
                

---

## 4. The Feedback Loop Logic (Tiered Evolution)

1. **Trigger:** User clicks "Rate a Drink" (via search or suggestion flow).

2. **Input:** User selects a beer (linked to catalog ID or generic style vector) and a rating:
    - **Loved it:** Fast adaptation ($N=5$). Pulls the user's vector strongly toward the beer.
    - **Liked it:** Standard adaptation ($N=10$). The baseline learning rate.
    - **Not my beer:** Avoidance logic ($N=20$). Shifts the user's vector *away* from the input vector (inverse adaptation). Useful for refining what the user *doesn't* like.

3. **Avoidance Calculation:**
    - The vector is shifted in the opposite direction of the beer's vector using a lower impact ($N=20$) to prevent radical shifts, while still refining the "do not recommend" zone of the sensory map.
    - **Lexicon Refinement:** Conversational descriptions replace robotic slashes (`/`) or ampersands (`&`) with natural connectors (e.g., "pale or golden" instead of "pale / golden") for a human-friendly tone.

4. **Contribution Tracking:**
    - Every rating increments the `sampleCount` in the store, refining the precision of future matches.
        

---

## 5. Billing & Super-Admin Logic

1. **Redemption Event:**
    
    - Identify `Coupon_Tier`.
        
    - Log `Fee_Amount` ($3 for Standard / $5 for Premium).
        
2. **Manager Dashboard:** Aggregate all `Redemption_Events` for `Location_ID`.
    
3. **Super-Admin Dashboard:** * List all `Locations`.
    
    - Show `Total_Billable_Amount` (sum of all fees).
        
    - Show `Staff_Rewards_Due` (count of successful guest-to-subscriber conversions).
        

---

## 6. Theme Switching & Persistence
1. **Trigger:** User toggles "Luxe Light Mode" / "Obsidian Night" in the Profile Menu.
2. **Action:** `setTheme(newTheme)` is called in the store.
3. **Logic:**
    - Updates local state (Zustand).
    - Injects/Removes the `.light` class on the root `Document` element.
    - Triggers CSS variable shifts (Semantic Design System).
    - Forces Leaflet Map re-render with new `TileLayer` URL.
4. **Persistence:** The choice is saved in `localStorage` to persist across sessions (Prototype: stored in top-level state).

---

## 7. Adaptive Initialization Quiz (Cold Start)

This logic ensures the system doesn't assume craft beer literacy for new users (`sampleCount == 0`).

1. **Gate 0: Familiarity Selection**
    - "New to Craft?" $\rightarrow$ **Level 1 (Flavor)**
    - "Occasional Drinker?" $\rightarrow$ **Level 2 (Style)**
    - "Connoisseur?" $\rightarrow$ **Level 3 (Vector)**

2. **Path 1: Level 1 (Flavor-Based)**
    - Questions map to core 5-axis attributes via analogies:
        - _Bitter:_ "Do you enjoy dark chocolate or grapefruit?"
        - _Malt/Body:_ "How do you like your coffee? (Black vs. Creamy)"
        - _Aromatics:_ "Preferred scents: (Floral/Fruit vs. Neutral)"
        - _ABV:_ "Preferred drink strength: (Light/All-day vs. Strong/Sipping)"

3. **Path 2: Level 2 (Style-Based)**
    - User selects from 4 clear archetypes (Lager, Wheat, IPA, Stout).
    - Mapped directly to reference sensory vectors in `bjcp_dictionary.json`.

4. **Path 3: Level 3 (Vector-Based)**
    - User interacts with the **5-Axis Radar Chart** to define their ideal profile.
    - Sets the `tasteVector` directly.

5. **Completion:**
    - Sets initial `tasteVector`.
    - Increments `sampleCount` (usually to 1 or 5 to provide a "weighted" baseline).
    - Unlocks the Home Page Recommendation section.

---

## 8. Location Discovery Logic (Places Suggestion)

This logic governs how the system identifies and ranks nearby venues.

1. **User Position (Mocked):**
    - The system identifies the current `lat/lng` from the **Location Selector**.
    - If no "bar" is selected, it defaults to the coordinates of the first "Street View" (`none` type) location to simulate a raw GPS coordinate.

2. **Distance Calculation:**
    - Uses the **Haversine Formula** to calculate the Great-circle distance between the user and all available `prototype_locations`.
    - **Discovery Radius Slider:** Filter results to only show locations within the user-defined range (500m to 10km).

3. **Filtering & Categorization:**
    - **Beers Tab:** Traditional sensory matching for the *current* location.
    - **Locations Tab:** Map-based discovery for *all* nearby locations.
    - **"none" type locations:** These are excluded from map rendering; they are purely used for coordinate mocking.

4. **Sort & Prioritization:**
    - **Primary Sort:** Distance (Ascending).
    - **Secondary Boost (Visual):** Locations with active **Premium Promotions** are highlighted with distinct "glow" markers/UI cards to catch the user's attention.
    - **Tier-Specific Visibility:** Even though Guests and Subscribers see locations with standard promotions first, the system draws attention to Premium spots to drive conversions while ensuring applicable standard deals are clearly listed.

5. **Map Rendering (Leaflet):**
    - **User Marker:** Centered on the mocked position.
    - **Venue Markers:** Filtered by radius and color-coded by promotion tier.
    - **Detail Overlay:** Clicking a marker displays the venue's active promotions and a "Top 3 Beer Matches" preview for that specific venue.

 - - - 
 
 # #   9 .   R e s e t   D a t a   F l o w   ( S t a t e   C l e a r i n g ) 
 1 .   * * T r i g g e r : * *   U s e r   c l i c k s   \  
 R e s e t  
 D a t a \   i n   a n y   n a v i g a t i o n   m e n u . 
 2 .   * * A c t i o n : * *   C o n f i r m a t i o n   p r o m p t   i s   s h o w n . 
 3 .   * * L o g i c : * * 
         -   \ u s e S t o r e . g e t S t a t e ( ) . r e s e t A l l ( ) \ :   W i p e s   a l l   d y n a m i c   s t a t e   ( R e d e m p t i o n   r e c o r d s ,   T a s t e   M a p ,   c u r r e n t   R o l e ) . 
         -   \ l o c a l S t o r a g e . c l e a r ( ) \ :   R e m o v e s   t h e   p e r s i s t e n t   s t o r e   k e y   ( \  t l a l l i - s t o r a g e \ ) . 
         -   \ w i n d o w . l o c a t i o n . h r e f   =   / [ l o c a l e ] \ :   F o r c e s   a   h a r d   r e l o a d   t o   f r e s h   g u e s t   s t a t e . 
 4 .   * * P u r p o s e : * *   F a c i l i t a t e s   r a p i d   m u l t i - p e r s o n a   t e s t i n g   o n   p h y s i c a l   m o b i l e   d e v i c e s .  
 