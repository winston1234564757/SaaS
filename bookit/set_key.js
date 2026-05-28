const { execSync } = require('child_process');
try {
  execSync('npx vercel env rm NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production -y', { stdio: 'inherit' });
} catch (e) {}
execSync('npx vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production', {
  input: 'AIzaSyDNxNVY--rvbX6mtOOKjRP3IqWo5jo_rCQ',
  stdio: ['pipe', 'inherit', 'inherit']
});
