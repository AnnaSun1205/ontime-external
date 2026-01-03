# "New" Tab Logic Documentation

## Overview
The "New" tab uses a **hybrid approach** that combines timestamp-based filtering with per-listing "dismissed" tracking. This allows users to see listings that appeared since their last visit, while also allowing them to manually dismiss individual listings.

---

## 1. New Tab Criteria

### Code Location
**Function**: `isNewListing()` (lines 566-576)  
**Filter Logic**: `timeFilteredListings` useMemo, case "new" (lines 434-444)

### Conditions for a Listing to Appear in "New" Tab

A listing appears in the "New" tab if **BOTH** conditions are true:

1. **Time-based condition**: `listing.firstSeenAt > lastSeenListingsAt`
   - `firstSeenAt`: When the listing was first seen by the system (from `opening_signals.first_seen_at`)
   - `lastSeenListingsAt`: Country-specific cutoff timestamp from `user_preferences.last_seen_listings_at_us` or `last_seen_listings_at_ca`
   - This cutoff is **NOT** automatically updated on login - it's manually preserved

2. **Dismissal condition**: `listing.id NOT IN seenListingIds`
   - `seenListingIds`: Set of listing IDs from `opening_seen` table for the current user
   - This is a per-user, per-listing "dismissed" flag

### Code Reference
```typescript
// Lines 566-576: isNewListing function
const isNewListing = (listing: Listing) => {
  if (!lastSeenListingsAt) return false;
  const isNewByTime = new Date(listing.firstSeenAt) > new Date(lastSeenListingsAt);
  const isNotSeen = !seenListingIds.has(listing.id);
  return isNewByTime && isNotSeen;
};

// Lines 434-444: New tab filter
case "new":
  if (!lastSeenListingsAt) return false;
  const isNewByTime = firstSeen > new Date(lastSeenListingsAt);
  const isNotSeen = !seenListingIds.has(listing.id);
  return isNewByTime && isNotSeen;
```

---

## 2. After User Clicks "Mark all as seen"

### Code Location
**Function**: `handleMarkAllAsSeen()` (lines 584-638)

### Immediate UI Behavior

When "Mark all as seen" is clicked:

1. **Listings disappear from "New" tab instantly**
   - The function updates `seenListingIds` state immediately (line 630-634)
   - This causes `isNewListing()` to return `false` for those listings
   - The "New" tab filter (line 442) excludes them because `isNotSeen` becomes `false`
   - React re-renders and removes them from the view

2. **Yellow "New" badge disappears**
   - The badge is conditionally rendered: `{isNew && (...)}` (line 900)
   - Since `isNewListing(listing)` now returns `false`, the badge disappears

3. **Card styling changes**
   - New listings have `bg-amber-50 border-amber-200` (line 893)
   - After marking as seen, they get `bg-card border-border` (line 894)

### What Gets Persisted to Database

**Table**: `opening_seen`
- **Action**: `UPSERT` (insert or update if exists)
- **Fields**:
  - `user_id`: Current user ID
  - `opening_id`: Listing ID
  - `seen_at`: Current timestamp (ISO string)
- **Conflict handling**: `onConflict: 'user_id,opening_id'` (unique constraint)

**What is NOT updated**:
- ❌ `opening_signals.last_seen_at` - NOT touched
- ❌ `user_preferences.last_seen_listings_at_us/ca` - NOT updated (preserved manually)
- ❌ `user_preferences.last_login` - NOT updated

### Code Reference
```typescript
// Lines 610-621: Database persistence
const rowsToInsert = idsToMarkSeen.map(openingId => ({
  user_id: userId,
  opening_id: openingId,
  seen_at: now
}));

const { error } = await supabase
  .from('opening_seen')
  .upsert(rowsToInsert, { onConflict: 'user_id,opening_id' });

// Lines 629-634: Immediate UI update
setSeenListingIds(prev => {
  const updated = new Set(prev);
  idsToMarkSeen.forEach(id => updated.add(id));
  return updated;
});
```

---

## 3. Relationship Between New Tab and Other Tabs

### Tabs are Different Filters Over the Same Dataset

**Yes**, all tabs (New, Today, Last 2 Days, Last 7 Days, All) are **different filters** applied to the same base dataset (`categoryFilteredListings`).

### Code Location
**Function**: `timeFilteredListings` useMemo (lines 421-456)

### Filter Logic by Tab

| Tab | Filter Condition | Code Lines |
|-----|-----------------|------------|
| **New** | `firstSeenAt > lastSeenListingsAt AND NOT in seenListingIds` | 434-444 |
| **Today** | `firstSeenAt >= startOfToday` | 445-446 |
| **Last 2 Days** | `firstSeenAt >= twoDaysAgo` | 447-448 |
| **Last 7 Days** | `firstSeenAt >= sevenDaysAgo` | 449-450 |
| **All** | No time filter (returns all) | 451-453 |

### Can Same Listing Appear in Multiple Tabs?

**Yes**, a listing can appear in multiple tabs simultaneously if it matches multiple criteria:

**Example Scenario**:
- Listing has `firstSeenAt = 2024-01-15 10:00` (today)
- User's `lastSeenListingsAt = 2024-01-14 00:00` (yesterday)
- Listing is NOT in `seenListingIds`

**Result**:
- ✅ Appears in **"New"** tab (firstSeenAt > lastSeenListingsAt AND not seen)
- ✅ Appears in **"Today"** tab (firstSeenAt >= startOfToday)
- ✅ Appears in **"Last 2 Days"** tab (firstSeenAt >= twoDaysAgo)
- ✅ Appears in **"Last 7 Days"** tab (firstSeenAt >= sevenDaysAgo)
- ✅ Appears in **"All"** tab (no filter)

### After Marking as Seen

**After marking a listing as "Seen"**:

- ❌ **Disappears from "New" tab** (because `isNotSeen` becomes `false`)
- ✅ **Still appears in "Today" tab** (if `firstSeenAt >= startOfToday`)
- ✅ **Still appears in "Last 2 Days" tab** (if `firstSeenAt >= twoDaysAgo`)
- ✅ **Still appears in "Last 7 Days" tab** (if `firstSeenAt >= sevenDaysAgo`)
- ✅ **Still appears in "All" tab** (no filter)

**Reason**: Only the "New" tab checks `seenListingIds`. Other tabs only check time-based conditions.

---

## 4. Behavior Summary (Spec)

### When a Listing Becomes "New"

A listing becomes "New" when:
- ✅ The system first sees it (`first_seen_at` is set in `opening_signals`)
- ✅ `first_seen_at > user_preferences.last_seen_listings_at_[us/ca]` (country-specific)
- ✅ The listing is NOT in `opening_seen` for the current user

**Note**: The `last_seen_listings_at_*` cutoff is **NOT** automatically updated on login. It's preserved manually and only changes when explicitly updated (not implemented in current code).

### When a Listing Stops Being "New"

A listing stops being "New" when **EITHER**:
1. **User marks it as seen**: Insert/update in `opening_seen` table
2. **User updates cutoff**: `last_seen_listings_at_*` is updated to a later timestamp (manual operation, not in current code)

**Note**: A listing does NOT automatically stop being "New" when:
- ❌ User logs in again
- ❌ Time passes (it stays "New" until explicitly dismissed or cutoff updated)
- ❌ User views it in other tabs

### Where Listings Appear Across Tabs

#### Before Marking as Seen

| Tab | Appears? | Condition |
|-----|----------|-----------|
| New | ✅ Yes | `firstSeenAt > lastSeenListingsAt AND NOT in seenListingIds` |
| Today | ✅ Yes (if today) | `firstSeenAt >= startOfToday` |
| Last 2 Days | ✅ Yes (if within 2 days) | `firstSeenAt >= twoDaysAgo` |
| Last 7 Days | ✅ Yes (if within 7 days) | `firstSeenAt >= sevenDaysAgo` |
| All | ✅ Always | No filter |

#### After Marking as Seen

| Tab | Appears? | Condition |
|-----|----------|-----------|
| New | ❌ No | Now in `seenListingIds`, so `isNotSeen = false` |
| Today | ✅ Yes (if today) | Only checks time, not `seenListingIds` |
| Last 2 Days | ✅ Yes (if within 2 days) | Only checks time, not `seenListingIds` |
| Last 7 Days | ✅ Yes (if within 7 days) | Only checks time, not `seenListingIds` |
| All | ✅ Always | No filter |

### Visual Indicators

- **Yellow badge**: Shown when `isNewListing(listing) === true` (line 900)
- **Amber background**: `bg-amber-50 border-amber-200` when `isNew && !isInInbox` (line 893)
- **Normal background**: `bg-card border-border` otherwise (line 894)

---

## Key Database Tables

### `opening_seen`
- **Purpose**: Per-user, per-listing "dismissed" tracking
- **Columns**: `user_id`, `opening_id`, `seen_at`
- **Unique constraint**: `(user_id, opening_id)`
- **Updated by**: "Mark all as seen" button

### `user_preferences`
- **Purpose**: Country-specific cutoff timestamps for "New" tab
- **Columns**: `last_seen_listings_at_us`, `last_seen_listings_at_ca`
- **Updated by**: Manual operations (not automatically on login)

### `opening_signals`
- **Purpose**: Listing data
- **Columns**: `first_seen_at`, `last_seen_at`, `role_category`, `job_type`, etc.
- **Note**: `last_seen_at` is NOT used for "New" tab logic

---

## Implementation Notes

1. **Country-specific cutoffs**: The system maintains separate cutoffs for US and Canada listings (`last_seen_listings_at_us` and `last_seen_listings_at_ca`)

2. **Immediate UI updates**: State is updated synchronously after database operation, so UI reflects changes immediately without waiting for a refetch

3. **Filter order**: The filtering pipeline is: Search → Country → Type → Category → Time Tab

4. **Count calculations**: Tab counts (including "New") are calculated based on `categoryFilteredListings` (after all filters except time tab)

