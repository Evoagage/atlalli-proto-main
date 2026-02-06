# CDMX Beer Discovery & Loyalty - AtlalliPrototype

## Overview
A high-fidelity prototype of the Mexico City craft beer recommendation engine. Built to demonstrate the $N=10$ taste evolution algorithm and the privacy-first bartender redemption workflow.

## Technical Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Internationalization:** next-intl (ES-MX, EN-US)
- **Charts:** Recharts (for 5-axis radar charts)
- **QR Codes:** qrcode.react
- **Cryptography:** jose (JWE/HMAC-SHA256 signatures)
- **Icons:** Lucide React
- **Deployment:** Cloudflare Pages (Edge Runtime)

## 🛠️ Instructions for AI Developers
This repository is anchored by the documents in `/docs`. 
1. **Always** check `/docs/Architecture.md` before creating new files.
2. **Never** use React Context; use the Zustand store in `src/store/useStore.ts`.
3. **Primary Palette:** Liquid Gold (#D4AF37) on Obsidian Night (#0D0D0D).
4. **All components and utilities must use TypeScript** (.tsx for components, .ts for utilities).

## 🧪 Prototype Testing Scenarios
1. **The Minor Check:** Select "Minor" at login; verify access is blocked.
2. **The Cold Start:** Complete the 3-question survey and view the Radar Chart.
3. **The Prospect Script:** Move location to "Generic Bar" and verify the sensory script generation.
4. **The Privacy Scan:** Redeem as a user, then switch to Bartender and verify no personal data is shown during scan.