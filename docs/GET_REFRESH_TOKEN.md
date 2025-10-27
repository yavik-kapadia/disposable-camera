# Get Your Refresh Token - Quick Guide

## Step 1: Open Your App in Chrome

Make sure you're signed in to your app at `http://localhost:3000`

## Step 2: Open DevTools Console

Press **F12** or **Cmd+Option+I** (Mac) to open DevTools, then click the **Console** tab.

## Step 3: Copy & Paste This Code

```javascript
(async () => {
  const { data } = await supabase.auth.getSession();
  console.log('\n=== COPY THIS TOKEN ===');
  console.log('REFRESH_TOKEN:', data.session.refresh_token);
  console.log('=======================\n');
})();
```

## Step 4: Copy the Refresh Token

You'll see output like:
```
=== COPY THIS TOKEN ===
REFRESH_TOKEN: v2.public.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
=======================
```

Copy the entire token (starts with `v2.public.`)

## Step 5: Update e2e/.env.e2e

Open `e2e/.env.e2e` and replace this line:

```env
E2E_REFRESH_TOKEN='REPLACE_WITH_REFRESH_TOKEN'
```

With your actual token:

```env
E2E_REFRESH_TOKEN='v2.public.eyJpc3M...' # Your actual refresh token
```

## Step 6: Run the Setup

```bash
npm run test:e2e:setup
```

That's it! Your session will now last for 60 days instead of just 1 hour!

---

## Quick Copy-Paste Command

If you prefer, here's the DevTools console command in one line:

```javascript
(async()=>{const{data}=await supabase.auth.getSession();console.log('\n=== REFRESH TOKEN ===\n',data.session.refresh_token,'\n====================\n');})();
```


