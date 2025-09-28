# Deployment Guide for Shibboleth Authentication App

## Option 1: Railway (Backend) + Netlify (Frontend)

### Backend Deployment (Railway)

1. **Create Railway Account**: https://railway.app
2. **Connect GitHub**: Link your ShibbolethLogin repository
3. **Create New Project**: Choose "Deploy from GitHub repo"
4. **Environment Variables**: Add these in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   IDP_SSO_URL=https://idp.slgti.ac.lk/idp/profile/SAML2/Redirect/SSO
   IDP_SLO_URL=https://idp.slgti.ac.lk/idp/profile/SAML2/Redirect/SLO
   SP_ENTITY_ID=https://your-railway-app.railway.app/metadata
   SP_CALLBACK_URL=https://your-railway-app.railway.app/api/auth/callback
   SP_LOGOUT_CALLBACK_URL=https://your-railway-app.railway.app/api/auth/logout/callback
   IDP_CERT=your-idp-certificate
   SESSION_SECRET=your-session-secret
   FRONTEND_URL=https://your-netlify-app.netlify.app
   ```
5. **Deploy**: Railway auto-deploys on git push

### Frontend Deployment (Netlify)

1. **Build React App**:
   ```bash
   cd frontend
   npm run build
   ```
2. **Create Netlify Account**: https://netlify.com
3. **Drag & Drop**: Upload the `build` folder to Netlify
4. **Environment Variables**: Set in Netlify dashboard:
   ```
   REACT_APP_API_URL=https://your-railway-app.railway.app/api
   ```
5. **Custom Domain**: Optional - set up your domain

## Option 2: Vercel (Full-Stack)

### Deploy Both Frontend & Backend

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```
2. **Configure vercel.json**:
   ```json
   {
     "builds": [
       { "src": "frontend/package.json", "use": "@vercel/static-build" },
       { "src": "backend/src/server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/backend/src/server.js" },
       { "src": "/(.*)", "dest": "/frontend/$1" }
     ]
   }
   ```
3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Option 3: DigitalOcean App Platform

1. **Create DigitalOcean Account**
2. **Create New App**: Choose GitHub repo
3. **Configure Components**:
   - **Backend**: Node.js service
   - **Frontend**: Static site
4. **Set Environment Variables**
5. **Deploy**: Auto-deploys on git push

## Post-Deployment Checklist

- [ ] Update IdP metadata with new SP URLs
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates (automatic on most platforms)
- [ ] Test SAML authentication flow
- [ ] Monitor application logs
- [ ] Set up domain names (optional)

## Cost Comparison

| Platform          | Frontend | Backend | Database | Total/Month |
| ----------------- | -------- | ------- | -------- | ----------- |
| Railway + Netlify | Free     | $5      | Included | $5          |
| Vercel            | Free     | $20     | Extra    | $20+        |
| DigitalOcean      | $5       | $5      | $15      | $25         |
| Render + Netlify  | Free     | $7      | $7       | $14         |

## Recommended: Railway + Netlify ($5/month)

- Easy deployment
- Automatic HTTPS
- Built-in database
- Good performance
- Great for SAML applications
