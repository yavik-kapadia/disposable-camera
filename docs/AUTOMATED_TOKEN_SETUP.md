# 🤖 Automated Token Extraction - No Manual Steps!

## What This Does

Automatically extracts your Supabase session tokens from your browser and updates `.env.e2e` file. **Zero copy-paste needed!**

## Prerequisites

1. ✅ You're signed in to your app in Chrome
2. ✅ Your dev server is running (`npm run dev`)

## One-Command Setup

```bash
npm run extract-tokens
```

That's it! The script will:
1. 🌐 Open Chrome
2. 🔍 Navigate to your app
3. 💾 Extract tokens from localStorage
4. 📝 Update `e2e/.env.e2e` automatically
5. ✅ Done!

## Full Workflow (3 Commands)

```bash
# Step 1: Extract tokens (automated!)
npm run extract-tokens

# Step 2: Set up authentication
npm run test:e2e:setup

# Step 3: Run your tests
npm run test:e2e
```

## What Gets Extracted

The script automatically gets:
- ✅ Access Token (valid for 1 hour)
- ✅ Refresh Token (valid for 60 days!)
- ✅ User ID
- ✅ User Email
- ✅ User Name

All automatically saved to `e2e/.env.e2e`!

## Output Example

```
🔍 ==========================================
🔍 AUTOMATED TOKEN EXTRACTION
🔍 ==========================================

🌐 Navigating to your app...
🔍 Extracting tokens from localStorage...

✅ Tokens extracted successfully!

👤 User Info:
   Name: Nix Melos
   Email: nixfossor@gmail.com
   ID: fb92d8f2-dbd2-47f7-9dec-6d3f795d4b5c

✅ Updated e2e/.env.e2e with tokens!

🎉 ==========================================
🎉 TOKENS EXTRACTED AND SAVED!
🎉 ==========================================

Next steps:
  1. Run the setup: npm run test:e2e:setup
  2. Run your tests: npm run test:e2e
```

## Troubleshooting

### "No session found in localStorage"

**Problem**: You're not signed in to the app.

**Solution**:
1. Open http://localhost:3000 in Chrome
2. Sign in with Google
3. Run `npm run extract-tokens` again

### "Error: connect ECONNREFUSED"

**Problem**: Dev server not running.

**Solution**:
```bash
# In one terminal
npm run dev

# In another terminal
npm run extract-tokens
```

### "Browser is already open"

The script opens Chrome briefly. If it's stuck, just close all Chrome windows and try again.

## Token Expiration

| Token | Lifetime | What Happens When Expired |
|-------|----------|---------------------------|
| Access Token | 1 hour | Need to extract again |
| Refresh Token | 60 days | Can auto-refresh access token |

With the refresh token, your tests will work for 60 days without re-extraction!

## Comparison: Manual vs Automated

### Manual Method (Old Way)
```
1. Open DevTools
2. Go to Console
3. Paste JavaScript code
4. Copy access token
5. Copy refresh token  
6. Open e2e/.env.e2e
7. Paste access token
8. Paste refresh token
9. Save file
```
⏱️ Time: ~3 minutes  
😓 Effort: High

### Automated Method (New Way)
```
1. npm run extract-tokens
```
⏱️ Time: ~10 seconds  
😎 Effort: Zero!

## How It Works

```typescript
// The script:
1. Opens Chrome with Playwright
2. Navigates to localhost:3000
3. Executes JavaScript to read localStorage
4. Extracts Supabase session data
5. Parses tokens and user info
6. Updates e2e/.env.e2e file
7. Closes browser
8. Done!
```

## Security Notes

✅ **Safe**: Script only reads from your local browser  
✅ **Private**: Tokens saved locally in `.env.e2e` (git-ignored)  
✅ **Secure**: No tokens sent anywhere, purely local operation

## Advanced Usage

### Extract tokens from a different URL

Edit `scripts/extract-tokens.ts` and change the URL:

```typescript
await page.goto('https://your-production-url.com');
```

### Extract tokens and run tests in one command

Create a custom script:

```bash
npm run extract-tokens && npm run test:e2e:setup && npm run test:e2e
```

## Benefits

✅ **Fast**: 10 seconds vs 3 minutes  
✅ **Automated**: No copy-paste errors  
✅ **Reliable**: Always gets the right tokens  
✅ **Convenient**: One command to rule them all  
✅ **Repeatable**: Easy to re-run when tokens expire

## Try It Now!

Make sure you're signed in to http://localhost:3000, then:

```bash
npm run extract-tokens
```

🎉 That's it! Your E2E tests are ready!


