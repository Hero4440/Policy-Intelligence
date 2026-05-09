# Testing Instructions: Chat Suggestions Update

## Quick Test (Browser)

1. **Open the application**
   ```
   http://localhost:4173
   ```

2. **Navigate to Chat tab**
   - Click on the "Chat" navigation item

3. **Observe initial suggestions**
   You should see three default suggestions:
   - "What are UHC's rituximab requirements?"
   - "Compare prior auth for adalimumab across payers"
   - "What are the step therapy rules for Humira?"

4. **Click on a suggestion**
   - Click "What are the step therapy rules for Humira?"

5. **Wait for response**
   - The assistant will respond with information about Humira

6. **Verify suggestions updated** ✓
   After the response, you should see NEW suggestions:
   - "What are the step therapy requirements for Humira?"
   - "Compare Humira coverage across different payers"
   - "What diagnosis codes are required for Humira?"

## Test Different Scenarios

### Scenario 1: Prior Authorization Questions
1. Type: "What are the prior authorization requirements?"
2. After response, suggestions should be PA-related:
   - "Which biologics require prior authorization?"
   - "Compare PA requirements across payers"
   - "What's the typical PA approval timeline?"

### Scenario 2: Payer-Specific Questions
1. Type: "Tell me about Aetna policies"
2. After response, suggestions should be payer-comparison related:
   - "Compare coverage policies across major payers"
   - "What are the key differences in payer requirements?"
   - "Which payer has the most restrictive policies?"

### Scenario 3: Coverage Questions
1. Type: "What is covered?"
2. After response, suggestions should be coverage-related:
   - "What are common coverage exclusions?"
   - "How do medical necessity criteria vary?"
   - "What documentation is needed for coverage?"

## What Was Fixed

**Before:** Suggestions stayed the same after asking a question
**After:** Suggestions dynamically update based on the conversation context

## Technical Details

The fix ensures that:
1. Suggestions update AFTER the assistant responds (not before)
2. Suggestions are based on the complete conversation history
3. The most recent message context is used (no stale state)

## Troubleshooting

If suggestions don't update:
1. Check browser console for errors (F12)
2. Verify both servers are running:
   - Backend: http://localhost:3000/api/health
   - Frontend: http://localhost:4173
3. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
