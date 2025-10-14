# 🚀 Quick Deployment Steps

## **1. Build the App**

```powershell
npm run build
```

Wait for it to complete. Should say "Compiled successfully".

---

## **2. Deploy to Firebase**

```powershell
firebase deploy
```

This will:
- Upload your Next.js app
- Deploy to Firebase Hosting
- Update any functions

**Takes 2-5 minutes.**

---

## **3. Update Kevin's User Record**

```powershell
node scripts/update-kevin-title.js
```

This sets:
- Kevin's title → "Vice President"
- Kevin's role → "admin"
- Result → Kevin excluded from sales dashboards

---

## **4. Test It**

Visit your app URL (Firebase will show it after deploy):
```
https://your-app.web.app
```

Check:
- ✅ Dashboard loads
- ✅ Shows Weekly/Monthly/Quarterly tabs (no Daily)
- ✅ Team dashboard doesn't show Kevin
- ✅ Kevin can still login as admin

---

## **That's It!** 🎉

If you get any errors, check `DEPLOYMENT_CHECKLIST.md` for troubleshooting.

---

## **Quick Rollback** (if needed)

```powershell
firebase hosting:rollback
```
