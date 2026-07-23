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

## [!] Enable Realtime in Supabase Dashboard (REQUIRED — must be done by you)
- [ ] Go to your Supabase project → Database → Replication
- [ ] Enable replication for `stars` and `comments` tables
- [ ] Without this, real-time subscriptions won't receive events

## [x] Test
- [ ] Once Realtime is enabled in Supabase dashboard, open two browser tabs
- [ ] Create star in tab 1 → tab 2 should play chime + show star + toast "✦ Someone shared a Happy emotion!"
- [ ] Comment on a star in tab 1 → tab 2 should play comment chime + update comments in open modal + toast

