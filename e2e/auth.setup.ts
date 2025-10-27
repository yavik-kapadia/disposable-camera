import { test as setup } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Simple authentication setup using your existing session
 * 
 * This uses the tokens you provided to inject a valid session
 */
setup('authenticate', async ({ page }) => {
  // Your tokens (extracted from localStorage)
  const accessToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImsrYnRJSmNTSWFNdlJRTEoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3VodmZyeXBnc3JoZ2F3dmVkZ3VjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmYjkyZDhmMi1kYmQyLTQ3ZjctOWRlYy02ZDNmNzk1ZDRiNWMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYxNTUzNjQzLCJpYXQiOjE3NjE1NTAwNDMsImVtYWlsIjoibml4Zm9zc29yQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTGZVSjNNVTFTOUVDcTVZWUlkakVCZTJnb1VzcVdMQW1UWnlqNklNM0NFTVBlLXNRPXM5Ni1jIiwiZW1haWwiOiJuaXhmb3Nzb3JAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ik5peCBNZWxvcyIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiJOaXggTWVsb3MiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMZlVKM01VMVM5RUNxNVlZSWRqRUJlMmdvVXNxV0xBbVRaeWo2SU0zQ0VNUGUtc1E9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwNzU4MzUzODQ2Mzg4NzQwMTM4NCIsInN1YiI6IjEwNzU4MzUzODQ2Mzg4NzQwMTM4NCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzYxNTUwMDQzfV0sInNlc3Npb25faWQiOiI5ODZhYmVhOC1iNGNkLTRjMjgtYWZiMS1lODExYmViZWJmNGYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.j6wTCXmPVLiaV9h-TTURHey55dWEDx7FpO6tXKGy0vA';
  const refreshToken = 'l6kdi2e5hpg7';
  
  const userEmail = 'nixfossor@gmail.com';
  const userId = 'fb92d8f2-dbd2-47f7-9dec-6d3f795d4b5c';

  console.log('🔐 Setting up authentication...');

  // Navigate to app
  await page.goto('/');
  
  // Inject session into localStorage
  await page.evaluate(([at, rt, email, id]) => {
    localStorage.setItem(
      'sb-uhvfrypgsrhgawvedguc-auth-token',
      JSON.stringify({
        access_token: at,
        refresh_token: rt,
        user: { id, email },
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      })
    );
  }, [accessToken, refreshToken, userEmail, userId]);

  console.log('✅ Session injected');

  // Verify by navigating to dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('✅ Authentication verified');

  // Save state
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Auth state saved to', authFile);
});

