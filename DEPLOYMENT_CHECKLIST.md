# 🚀 Deployment Checklist

## **Pre-Deployment**

### ✅ **1. Build Locally**
```bash
npm run build
```
- Should complete without errors
- Check for TypeScript errors
- Check for build warnings

### ✅ **2. Test Locally** (Optional but recommended)
```bash
npm run dev
```
Visit `http://localhost:3001` and test:
- [ ] Dashboard loads
- [ ] Period switching works (Weekly/Monthly/Quarterly)
- [ ] Team dashboard loads
- [ ] No console errors

### ✅ **3. Commit All Changes**
```bash
git status
git add -A
git commit -m "Your message"
```

---

## **Deployment Steps**

### **Option A: Deploy Everything (Recommended)**

```bash
firebase deploy
```

This deploys:
- ✅ Hosting (Next.js app)
- ✅ Functions (if any)
- ✅ Firestore rules
- ✅ Storage rules

**Expected output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-app.web.app
```

---

### **Option B: Deploy Hosting Only** (Faster)

```bash
firebase deploy --only hosting
```

Use this if you only changed frontend code (no API routes, no functions).

---

### **Option C: Deploy Functions Only**

```bash
firebase deploy --only functions
```

Use this if you only changed API routes or backend functions.

---

## **Post-Deployment**

### ✅ **1. Verify Deployment**

Visit your production URL:
```
https://your-app.web.app
```

Check:
- [ ] App loads
- [ ] Login works
- [ ] Dashboard displays correctly
- [ ] Team dashboard shows only sales users (Kevin excluded)

### ✅ **2. Update Kevin's User Record**

**Run the script:**
```bash
node scripts/update-kevin-title.js
```

**OR manually in Firebase Console:**
1. Go to Firestore Database
2. Collection: `users`
3. Find: `kevin@cwlbrands.com`
4. Update:
   - `title`: `"Vice President"`
   - `role`: `"admin"`
   - `updatedAt`: (current timestamp)

### ✅ **3. Test Kevin's Exclusion**

**Visit team dashboard:**
```
https://your-app.web.app/team-dashboard
```
- [ ] Kevin should NOT appear in leaderboard
- [ ] Only sales reps and managers visible

**Check team metrics API:**
```bash
curl https://your-app.web.app/api/public/team-metrics?period=weekly
```
- [ ] Kevin's metrics NOT in totals

**Test Kevin's access:**
- [ ] Login as kevin@cwlbrands.com
- [ ] Can access admin features
- [ ] Can access commissions app

### ✅ **4. Test JustCall (Optional)**

```bash
curl https://your-app.web.app/api/test-justcall
```
- [ ] Returns success with user list and calls

---

## **Rollback Plan** (If Issues Arise)

### **Rollback to Previous Version:**
```bash
firebase hosting:rollback
```

### **Revert Git Changes:**
```bash
git log --oneline  # Find commit to revert to
git revert <commit-hash>
git push
firebase deploy
```

---

## **Common Issues**

### **Issue: Build Fails**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### **Issue: Firebase Not Logged In**
```bash
firebase login
firebase projects:list
firebase use <project-id>
```

### **Issue: Deployment Hangs**
- Check internet connection
- Try deploying hosting only: `firebase deploy --only hosting`
- Check Firebase status: https://status.firebase.google.com/

### **Issue: Kevin Still Appears on Dashboard**
- Verify his user record was updated in Firestore
- Check browser cache (hard refresh: Ctrl+Shift+R)
- Check API response: `/api/public/team-leaderboard?period=weekly`

---

## **Environment Variables**

Make sure these are set in Firebase Functions config:

```bash
firebase functions:config:get
```

Should include:
- `copper.api_key`
- `copper.user_email`
- `justcall.api_key`
- `justcall.api_secret`

If missing, set them:
```bash
firebase functions:config:set copper.api_key="YOUR_KEY"
firebase functions:config:set copper.user_email="YOUR_EMAIL"
firebase functions:config:set justcall.api_key="YOUR_KEY"
firebase functions:config:set justcall.api_secret="YOUR_SECRET"
```

---

## **Quick Commands Reference**

```bash
# Build
npm run build

# Deploy everything
firebase deploy

# Deploy hosting only (faster)
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions

# Check deployment status
firebase projects:list

# View logs
firebase functions:log

# Rollback
firebase hosting:rollback

# Update Kevin's title
node scripts/update-kevin-title.js
```

---

## **Success Criteria**

✅ **Deployment successful if:**
1. App loads at production URL
2. No console errors
3. Dashboard shows Weekly/Monthly/Quarterly tabs (no Daily)
4. Team dashboard excludes Kevin
5. Kevin can still login and access admin features
6. All other users appear normally on dashboards

---

## **Need Help?**

- Firebase Console: https://console.firebase.google.com
- Firebase Status: https://status.firebase.google.com
- Check logs: `firebase functions:log`
- Check build output for errors

---

**Last Updated**: October 14, 2025
