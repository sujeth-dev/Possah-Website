# Reviews Schema — Current State & Migration Plan

## Current State (verified May 2026)

The `reviews` table uses a **binary approval system**:

```sql
is_approved BOOLEAN NOT NULL DEFAULT FALSE
```

There is no `status` column. Earlier documentation was wrong — it described a `status TEXT` column
with values `pending | approved | rejected`. That column does not exist in the live database.

### What the binary system means in practice

| DB value | Meaning | UI label |
|---|---|---|
| `is_approved = false` | Not yet reviewed, OR was reviewed and rejected | "Pending" |
| `is_approved = true` | Reviewed and approved, visible on product pages | "Approved" |

The admin UI has three tabs: Pending / Approved / All.
The "Reject" button sets `is_approved = false` — which is indistinguishable from a brand-new
unreviewed submission. There is no permanent "rejected" state tracked in the DB.

### Why this works for v1

- Possah is a small-catalog luxury brand. Review volume is low.
- The admin team reviews everything manually in one pass.
- A "rejected" review is simply left in the Pending tab (or deleted).
- The product display query filters `is_approved = true` — rejected reviews never appear.
- No customer-facing "your review was rejected" message is needed at launch.

### Code verified correct

Both the API route and the React component already use `is_approved BOOLEAN` correctly.
No code changes are needed.

```ts
// app/api/admin/reviews/route.ts — already correct
GET  pending:  .eq('is_approved', false)
GET  approved: .eq('is_approved', true)
PATCH approve: { is_approved: true }
PATCH reject:  { is_approved: false }
```

---

## When to migrate to a 3-state system

Migrate if **any** of these become true:
- Need to send customers "your review was rejected" email (requires knowing it was rejected, not just unreviewed)
- Need analytics on rejection rate vs. pending rate separately
- Moderation team wants a queue that clears approved/rejected reviews out of "Pending"
- Customer-facing "pending review" badge is added to order history

---

## Migration plan (run when needed — NOT now)

### Step 1 — Add migration file

```sql
-- supabase/migrations/023_reviews_status.sql

-- Add status column with sensible default
ALTER TABLE reviews
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Back-fill from is_approved
UPDATE reviews SET status = 'approved' WHERE is_approved = true;
UPDATE reviews SET status = 'pending'  WHERE is_approved = false;

-- Create index for the admin query pattern
CREATE INDEX idx_reviews_status ON reviews(status);

-- Keep is_approved in sync via trigger (or remove it after code is updated)
-- Option A: keep both in sync (safer rollback)
CREATE OR REPLACE FUNCTION sync_review_approval()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    NEW.is_approved := true;
  ELSE
    NEW.is_approved := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_review_approval
  BEFORE INSERT OR UPDATE OF status ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_review_approval();
```

### Step 2 — Update API route

```ts
// app/api/admin/reviews/route.ts

// GET — change filter
pending:  .eq('status', 'pending')
approved: .eq('status', 'approved')
rejected: .eq('status', 'rejected')   // ← new tab

// PATCH — change update payload
approve: { status: 'approved' }
reject:  { status: 'rejected' }       // ← now permanent
```

### Step 3 — Update ReviewManager.tsx

Add a fourth tab: "Rejected". Wire it to the new GET?filter=rejected query.
Optionally add a "Move to Pending" action to un-reject a review.

### Step 4 — Drop is_approved (optional, after full migration)

Once all code uses `status` and the trigger is verified in production for 1 week:

```sql
-- supabase/migrations/024_drop_is_approved.sql
DROP TRIGGER IF EXISTS trg_sync_review_approval ON reviews;
DROP FUNCTION IF EXISTS sync_review_approval();
ALTER TABLE reviews DROP COLUMN is_approved;
```

---

## Decision: do NOT migrate now

The binary system is correct for launch. The migration adds complexity with zero
user-facing benefit at current review volume. Revisit after first 500 reviews.
