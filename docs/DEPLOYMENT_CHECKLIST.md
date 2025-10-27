# Deployment Checklist

Use this checklist to deploy your Disposable Camera app to production.

## Pre-Deployment Setup

### 1. Supabase Configuration
- [ ] Supabase project created
- [ ] Database schema executed (`supabase/schema.sql`)
- [ ] Storage bucket `event-images` created
- [ ] Storage bucket set to **Public**
- [ ] Storage policies configured (SELECT, INSERT, DELETE)
- [ ] API credentials copied (URL and anon key)

### 2. Local Testing
- [ ] `.env.local` file created with Supabase credentials
- [ ] App runs locally (`npm run dev`)
- [ ] Can create an event
- [ ] Can join event with access code
- [ ] Camera works (on localhost)
- [ ] Manual upload works
- [ ] Images appear in gallery
- [ ] Can download single image
- [ ] Can download all images as ZIP
- [ ] Can close/reopen event

## Deployment to Vercel

### 1. Prepare Repository
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.local` is in `.gitignore` (don't commit secrets!)
- [ ] All dependencies listed in `package.json`
- [ ] Build succeeds locally (`npm run build`)

### 2. Create Vercel Project
- [ ] Sign in to [vercel.com](https://vercel.com)
- [ ] Click "Add New Project"
- [ ] Import your Git repository
- [ ] Configure project:
  - Framework Preset: **Next.js**
  - Root Directory: `./` (or your project root)
  - Build Command: `npm run build` (default)
  - Output Directory: `.next` (default)

### 3. Environment Variables
Add these in Vercel Project Settings > Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
- [ ] `NEXT_PUBLIC_APP_URL` = your Vercel domain (e.g., `https://your-app.vercel.app`)

> **Note**: You can set these for all environments (Production, Preview, Development)

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Check deployment logs for errors
- [ ] Visit your deployed URL

### 5. Post-Deployment Configuration

#### Update Supabase CORS
- [ ] Go to Supabase Dashboard
- [ ] Settings > API > CORS
- [ ] Add your Vercel domain (e.g., `https://your-app.vercel.app`)

#### Update Environment Variable
- [ ] In Vercel, update `NEXT_PUBLIC_APP_URL` to your actual domain
- [ ] Redeploy to apply changes

## Testing Production Deployment

### Critical Path Tests
- [ ] Home page loads correctly
- [ ] Create event works
- [ ] QR code generates with correct URL
- [ ] QR code scans and opens camera page
- [ ] Join event with access code works
- [ ] Camera access works (must be HTTPS)
- [ ] Can take photo with camera
- [ ] Photo uploads successfully
- [ ] Photo appears in event dashboard
- [ ] Real-time updates work
- [ ] Can download single photo
- [ ] Can download all photos as ZIP
- [ ] Can close event
- [ ] Closed event prevents uploads

### Mobile Testing
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Camera works on mobile
- [ ] Upload works on mobile
- [ ] QR code scans correctly
- [ ] Images display properly
- [ ] Download works on mobile

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Image upload completes successfully
- [ ] Multiple uploads don't crash
- [ ] Gallery loads with 10+ images
- [ ] ZIP download works with 20+ images

## Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles (`npm run build` locally)
- Check environment variables are set

### Camera Not Working
- Verify deployment is on HTTPS
- Check browser permissions
- Test on different browsers/devices
- Check console for errors

### Images Not Uploading
- Verify Supabase credentials are correct
- Check Storage bucket exists and is public
- Verify Storage policies are set
- Check browser console for errors
- Test Supabase connection

### QR Code Wrong URL
- Check `NEXT_PUBLIC_APP_URL` is set to production URL
- Redeploy after changing environment variables
- Generate new QR code by creating new event

### Real-time Updates Not Working
- Check Supabase Realtime is enabled
- Verify subscription code is correct
- Test by opening two browser windows
- Check browser console for errors

## Optional Enhancements

### Custom Domain
- [ ] Add custom domain in Vercel
- [ ] Update DNS records
- [ ] Update `NEXT_PUBLIC_APP_URL` to custom domain
- [ ] Update Supabase CORS for custom domain
- [ ] Test with new domain

### Analytics
- [ ] Add Vercel Analytics
- [ ] Add Google Analytics
- [ ] Track event creation
- [ ] Track photo uploads

### Monitoring
- [ ] Set up Vercel error tracking
- [ ] Monitor Supabase usage
- [ ] Set up uptime monitoring
- [ ] Configure alerts

## Production Best Practices

### Security
- [ ] Review Supabase RLS policies
- [ ] Check Storage bucket policies
- [ ] Verify environment variables are secret
- [ ] Consider rate limiting

### Performance
- [ ] Enable Vercel Analytics
- [ ] Monitor image sizes
- [ ] Check database query performance
- [ ] Optimize images if needed

### Maintenance
- [ ] Set up automated backups (Supabase does this)
- [ ] Monitor storage usage
- [ ] Plan for scaling if needed
- [ ] Keep dependencies updated

## Go-Live Checklist

Final checks before sharing with users:

- [ ] All tests pass
- [ ] Documentation is accessible
- [ ] Support contact is ready
- [ ] Backup plan exists
- [ ] Monitoring is active
- [ ] Team knows how to respond to issues

## Post-Launch

### First Week
- [ ] Monitor error logs daily
- [ ] Check user feedback
- [ ] Track usage metrics
- [ ] Fix critical bugs immediately

### Ongoing
- [ ] Review storage costs weekly
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Monitor for security issues

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project README](./README.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)

---

**Ready to launch? Good luck! 🚀**
