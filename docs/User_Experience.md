---

Project: Atlalli Prototype
Version: 1.0 (Final Production Spec)
Target: Mexico City Market (Bilingual Support: ES-419 / EN-US)

---

# 🗣️ Sensory Dictionary & Fallback Logic


## 1. The Conversational Sensory Dictionary

To ensure accessibility for non-experts, the technical BJCP descriptors are mapped to "Consumer-Friendly" terms. This dictionary is the source for all recommendation cards and "Sensory Scripts."

### 1.1 Sensory Axis Mapping

The five axes are translated into terms that an average user in CDMX or an English speaker would easily identify.

| **Axis**       | **Conversion Key** | **English (US)**         | **Spanish (LATAM/MX)**         |
| -------------- | ------------------ | ------------------------ | ------------------------------ |
| **Bitterness** | `BITTER_LOW`       | Smooth & Mellow          | Suave y Ligera                 |
|                | `BITTER_MED`       | Balanced Bite            | Amargor Balanceado             |
|                | `BITTER_HIGH`      | Sharp & Hoppy            | Amargor Marcado / Muy Lupulada |
| **Malt**       | `MALT_LIGHT`       | Crisp / Bready           | Refrescante / Notas de Pan     |
|                | `MALT_MED`         | Toasty / Caramel         | Tostada / Notas de Caramelo    |
|                | `MALT_DARK`        | Coffee / Chocolate       | Notas de Café o Chocolate      |
| **Body**       | `BODY_LIGHT`       | Light & Thirst-Quenching | Ligera y Refrescante           |
|                | `BODY_MED`         | Smooth Mouthfeel         | Sedosa / Cuerpo Medio          |
|                | `BODY_HIGH`        | Full & Creamy            | Con mucho cuerpo / Cremosa     |
| **Aromatics**  | `AROMA_CLEAN`      | Clean & Neutral          | Perfil Limpio / Neutra         |
|                | `AROMA_COMPLEX`    | Fruity & Spiced          | Frutal / Especiada             |
|                | `AROMA_FUNK`       | Earthy / Floral          | Notas de Tierra / Floral       |
| **ABV**        | `ABV_LOW`          | Sessionable (Light)      | Ligera (Para toda la tarde)    |
|                | `ABV_MED`          | Standard Strength        | Graduación Estándar            |
|                | `ABV_HIGH`         | Strong & Warming         | Intensa / Cálida               |

---

## 2. Fallback Logic: The "Smart Switch"

Consistency is the priority. When a primary recommendation cannot be fulfilled, the system triggers the following logic.

### 2.1 The Decision Matrix

1. **Trigger:** User indicates "Beer Not Available".
    
2. **Check User Preference:** The system queries `Users/{uid}/preferences.default_fallback`.
    
3. **Execution Path:**
    
    - **Path A (Second Recommendation):** The system calculates the next best match from the `Sponsor` beer list and displays a new recommendation card.
        
    - **Path B (Sensory Script):** The system generates a text string based on the user's current top weights and the **Conversational Dictionary**.
        
4. **No Preference Set:** If `default_fallback` is null, the system presents two buttons: **[Find Another]** and **[Show Script]**.
    

---

## 3. "Sticky" Preferences & UX Implementation

### 3.1 The "Always Use" Checkbox

Every time a fallback decision is made manually, a checkbox is displayed: **"Always use this choice in the future."**

- **Checking this box:** Updates the Firestore field `always_use_default: true` and sets the `default_fallback`.
    
- **Result:** Future recommendations that fail availability checks will automatically skip the question and execute the preferred path.
    

### 3.2 User Control Center

Within the "User Profile" screen, a **Preferences Section** allows users to:

- Toggle `default_fallback` (Script vs. Second Option).
    
- Reset the "Always Ask" behavior.
    
- Switch Language (Forces override of browser detection).
    

---

## 4. The "Sensory Script" Generator

When "Path B" is triggered, the system builds a string using this template:

**Template (ES):** _"Pregunta por algo [BODY] que sea [MALT] y tenga un aroma [AROMATICS]."_ **Example:** _"Pregunta por algo **ligero** que sea **tostado** y tenga un aroma **frutal**."_

**Template (EN):** _"Ask for something [BODY] that is [MALT] with a [AROMATICS] aroma."_ **Example:** _"Ask for something **smooth** that is **coffee-like** with an **earthy** aroma."_

---

## 5. Metadata Logic: Premium Sponsors

If a user is at a `is_premium: true` Sponsor location, the logic expands:

- **Constraint Filter:** Before matching, the system filters the bar's inventory by user-selected metadata (e.g., _"Only show me Pet Friendly options"_).
    
- **Monetization:** This feature is hidden for standard Sponsors, encouraging upgrades to the Premium tier.
    
