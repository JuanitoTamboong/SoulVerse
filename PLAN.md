# SoulVerse Chat & Notification Fix Plan

## Issues Identified

### 1. Missing `renderChatMessages()` function
Referenced in `sendChatMessage()`, `startChatWith()`, and realtime subscription but never implemented.

### 2. Missing `loadChatHistory()` function
Referenced in `startChatWith()` and `openChatPanel()` but never implemented.

### 3. Corrupted code in `js/script.js`
Around the `startChatWith()` function area, there are orphaned HTML template fragments:
```
        </div>` : ''}
        <div class="chat-msg-edit-form" data-msg-id="${msg.id}">
```
This is leftover from a partial/incomplete `renderChatMessages()` implementation.

### 4. Delete private message not wired to UI
`deletePrivateMessage()` exists in Supabase operations but has no UI button in chat messages.

### 5. Edit private message not wired to UI
`editPrivateMessage()` exists in Supabase operations but has no edit button/functionality in chat messages.

### 6. Notification delay issues
- Toast notifications use 3000ms timeout (OK)
- Realtime subscription references broken `renderChatMessages()` 
- Need to ensure instant delivery with realtime

## Plan

### Step 1: Fix corrupted code
- Remove orphaned HTML fragments between `startChatWith()` and `openChatPanel()`
- Clean up the area to restore proper JavaScript syntax

### Step 2: Implement `loadChatHistory()`
- Load private messages from Supabase for current conversation
- Store in `state.chatMessages`
- Call `renderChatMessages()` after loading
- Mark messages as read

### Step 3: Implement `renderChatMessages()`
- Render chat messages in the chat detail view
- Show sent messages (right-aligned) vs received (left-aligned)
- Add "edited" indicator for edited messages
- Add delete button hover action for own messages
- Add edit button hover action for own messages
- Include inline edit form for editing messages
- Show deleted message placeholder

### Step 4: Wire up delete functionality
- Add delete button in chat message actions
- Implement confirmation or instant delete
- Update UI and Supabase

### Step 5: Wire up edit functionality
- Add edit button in chat message actions
- Show inline edit form replacing the bubble
- Save on submit/Enter
- Cancel on Escape
- Update UI and Supabase

### Step 6: Notification fixes
- Ensure realtime subscription properly calls fixed `renderChatMessages()`
- Add toast for new messages
- Chat badge update for unread count

## Files to Edit
1. `js/script.js` — main implementation
2. `css/style.css` — already has styles for edit/delete (verify existing)

## Files to Create
None needed

