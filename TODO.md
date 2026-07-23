# TODO: Real-Time Sound & UI for Stars & Comments

## [x] Add `playCommentChime()` - Softer chime for new comments
- [x] Create function generating a shorter, higher-pitched oscillator tone
- [x] Distinguish from existing `playChime()` used for new stars

## [x] Add Realtime Subscriptions for `stars` (INSERT)
- [x] Subscribe to `postgres_changes` on `stars` table
- [x] Filter out own stars (`user_id !== state.sessionId`)
- [x] Play chime on new star from others
- [x] Show toast notification
- [x] Add to `state.messages` and rebuild galaxy + filters

## [x] Add Realtime Subscriptions for `comments` (INSERT)
- [x] Subscribe to `postgres_changes` on `comments` table
- [x] Play `playCommentChime()` on new comment
- [x] Show toast notification
- [x] If modal is open for that star, append comment to comments list

## [x] Call `setupRealtimeSubscriptions()` in `init()`
- [x] Ensure subscriptions start after Supabase client is ready

## [!] Enable Realtime in Supabase Dashboard (RECOMMENDED — but NOT required)
- [ ] Go to your Supabase project → Database → Replication
- [ ] Enable replication for `stars` and `comments` tables
- [ ] Without this, real-time subscriptions won't receive events
- [ ] ✅ **Fallback polling added** — automatically detects new stars every 10 seconds and plays the "tingggg" chime even without Realtime enabled

## [x] Add Polling Fallback for New Stars
- [x] Added `state.lastKnownStarTimestamp` to track the most recent star
- [x] Added `state.newStarPollTimer` for managing poll intervals
- [x] Added `startNewStarPolling()` — queries for stars created after the last known timestamp every 10 seconds
- [x] Added `stopNewStarPolling()` — cleanup function for the poll timer
- [x] Integrated polling into `initializeApp()` — sets initial timestamp from loaded stars
- [x] Integrated polling into `init()` — starts polling after initialization

## [x] Test
- [ ] Once Realtime is enabled in Supabase dashboard, open two browser tabs
- [ ] Create star in tab 1 → tab 2 should play chime + show star + toast "✦ Someone shared a Happy emotion!"
- [ ] Comment on a star in tab 1 → tab 2 should play comment chime + update comments in open modal + toast

