# Data Schemas

## 5-Axis Sensory Vector
All beers and user profiles use:
- `bitter`, `malt`, `body`, `aromatics`, `abv` (Float: 0.0 to 1.0).
- `showBartenderScript` (Boolean): Persistent UI preference for recommendations.
- `discoveryRadius` (Integer): Radius in meters for location discovery (500 to 10000).
- `lat` / `lng` (Float): Coordinates for venues and user mocking.

## Inventory Schema
- `Sponsors`: Linked to `catalog.json` via ID.
- `Locations`: May include `groupId` for chain associations (e.g., 'drunkendog').
- `Prospects`: Use the `style_ref` from `bjcp_dictionary.json` to generate generic scripts.
- **Theme Logic Mapping**: Maps semantic variables (`--bg-app`, `--text-primary`) to theme-specific hex codes.
- **Conversational Dictionary**: Maps technical scores to ES-419/EN-US keys.

## Logic Mapping
- Conversational Dictionary: Maps technical scores to ES-419/EN-US keys.

## Redemption Record
- `id`: Unique identifier (`nonce:u_id`).
- `couponId`: Link to `coupons.json`.
- `userId`: Google SSO Sub ID (for members).
- `guestEmail`: Verified email (for guests).
- `staffId`: ID of the scanning staff.
- `locationId`: Mandatory ID of the redemption venue.
- `timestamp`: Redemption time.
- `billId`: Mandatory POS invoice reference.
- `tier`: The tier of the coupon redeemed (`standard` or `premium`).
- **Audit Requirement**: Redemptions without a `billId` are considered "Unverified" and excluded from B2B billing reports.
- **Verification Rule**: Redemptions are scoped by **Promotion + Location + User**.

## User Profile
- `sub`: Unique ID.
- `role`: One of `UserRole` enum.
- `scope`: { `type`: 'global' | 'group' | 'location', `id`?: string }. Defines where privileged roles are active.

## Beer Suggestion
- `id`: Unique receipt ID.
- `userId`: Sub ID of the contributor (or 'anonymous').
- `userName`: Display name (captured from session).
- `timestamp`: Creation date.
- `beerName`: Input string.
- `brewery`: Input string.
- `style`: Input string.
- `abv`: Optional string (as entered).
- `description`: Optional text.
- `status`: One of `pending`, `approved`, `rejected` (managed strictly by Super-Admin via dedicated Admin Dashboard).
- `adminNote`: Feedback from admin to the contributor (displayed in Message Center).
- `processedAt`: Timestamp of approval/rejection.

## Catalog Beer (Master)
- `id`: Unique system identifier (e.g., `brewery_brand`).
- `brand_name`: Official brand name.
- `brewery`: Official brewery name.
- `style_ref`: BJCP Style Reference from `bjcp_dictionary.json`.
- `override_vector`: Optional partial `TasteVector` to override style defaults.
- `isDeleted`: Soft-delete flag.
- `deletedAt`: Timestamp for the 7-day undo window.

## Notification
- `id`: Unique identifier.
- `userId`: Recipient ID.
- `type`: `suggestion_approved`, `suggestion_rejected`, or `pending_evaluation`.
- `message`: User-facing message.
- `data`: Payload containing `beerId`, `locationId`, or `adminNote`.
- `read`: Status flag.
- `timestamp`: Creation time.

## Brewery
- `id`: Unique identifier (e.g., `hercules`).
- `name`: Official registered name.
- `location`: Origin / Region (optional).

> [!NOTE]
> Redemptions are scoped by **Promotion + Location + User**. This allows a user to redeem the same promotion multiple times across different participating venues, but only once per venue.