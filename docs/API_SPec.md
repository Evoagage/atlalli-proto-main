# Mock API Contract
**Environment:** All fetches are mocked via `setTimeout` and local JSON.

## Mock YouTube Auth
- `GET /api/auth/youtube`: Returns `{ age: number, isSubscribed: bool, isMember: bool }`.
- If `age < 18`, logic must route to `/access-denied`.

## Mock Redemption
- `POST /api/redeem`: Validates JWE signature.
- Response must NOT contain `display_name` or `email` when called by `role: bartender`.
- Returns `{ status: 'success', amberPulse: true }`.