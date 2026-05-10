# Chat Suggestions Update Fix

## Problem
The suggested questions in the chat interface were not updating after the user sent a message and received a response. The suggestions remained static even though the code had logic to provide contextual follow-up questions.

## Root Cause
There were two issues:

1. **Timing Issue**: Suggestions were being updated BEFORE the assistant responded, which meant they were based only on the user's question, not the full conversation.

2. **Stale Closure Issue**: When updating suggestions, the code was using a stale `messages` variable from the closure instead of the current state, causing it to miss the newly added messages.

## Solution

### Before (Broken)
```typescript
// Update suggestions immediately after user message
setMessages((current) => [...current, userMessage]);
setSuggestedQuestions(getContextualSuggestions([...messages, userMessage]));

// Later, after API response
setMessages((current) => [...current, assistantMessage]);
// No suggestion update here!
```

### After (Fixed)
```typescript
// Don't update suggestions yet
setMessages((current) => [...current, userMessage]);

// After API response, update both messages AND suggestions
setMessages((current) => {
  const updatedMessages = [...current, assistantMessage];
  // Update suggestions with the complete conversation
  setSuggestedQuestions(getContextualSuggestions(updatedMessages));
  return updatedMessages;
});
```

## Key Changes

1. **Removed premature suggestion updates** - No longer updating suggestions before the assistant responds

2. **Used callback form of setState** - Using `setMessages((current) => ...)` to access the most recent state

3. **Updated suggestions after response** - Suggestions now update after the assistant message is added, ensuring they're based on the full conversation

## Testing

To test the fix:

1. Open http://localhost:4173
2. Navigate to the Chat tab
3. Click on a suggested question (e.g., "What are the step therapy rules for Humira?")
4. Wait for the assistant to respond
5. Observe that the suggestions update to contextual follow-ups

### Expected Behavior

**Initial suggestions:**
- What are UHC's rituximab requirements?
- Compare prior auth for adalimumab across payers
- What are the step therapy rules for Humira?

**After asking about Humira:**
- What are the step therapy requirements for Humira?
- Compare Humira coverage across different payers
- What diagnosis codes are required for Humira?

**After asking about prior authorization:**
- Which biologics require prior authorization?
- Compare PA requirements across payers
- What's the typical PA approval timeline?

## Files Modified
- `src/frontend/components/chat-view.tsx` - Fixed suggestion update logic in both `handleSubmit` and `handleSuggestedQuestion` functions

## Impact
Users now get relevant, contextual follow-up questions after each interaction, making the chat experience more intuitive and helpful.
