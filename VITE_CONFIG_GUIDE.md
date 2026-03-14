# Vite Configuration for CORS & HTTP/HTTPS

## Current Setup ✅

Your `vite.config.ts` is now configured with:
1. **Development proxy** (optional) - routes `/api/*` to your backend
2. **Port configuration** - runs on port 5174

---

## Two Approaches for API Calls

### **Approach 1: Direct API Calls (Current - Recommended)**

**How it works:**
- Frontend directly calls `http://13.60.14.202:4000/api/...`
- Backend handles CORS (already configured ✅)

**Pros:**
- Simple, transparent
- Works with any backend URL
- Easy to switch backends

**Cons:**
- ⚠️ **Mixed Content Warning**: HTTPS frontend → HTTP backend may be blocked by browsers

**Use this when:**
- Backend has proper CORS configured (you do!)
- You're okay with HTTP backend for now

---

### **Approach 2: Use Vite Proxy (Alternative)**

**How it works:**
- In **development**: calls go to `/api/*` → Vite proxies to backend
- In **production**: calls go directly to backend URL

**Setup required:**

1. Update `src/config/api.ts`:
```typescript
// Use proxy in development, direct URL in production
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment
  ? '' // Use proxy (relative URLs)
  : (import.meta.env.VITE_BACKEND_URL || 'http://13.60.14.202:4000');
```

**Pros:**
- No CORS issues in development
- Cleaner development experience

**Cons:**
- Different behavior in dev vs production
- Production still has mixed content issue

---

## 🚨 The Real Issue: Mixed Content (HTTPS → HTTP)

Your **Vercel deployment uses HTTPS** but your **backend uses HTTP**. Modern browsers block this!

### **Solution Options:**

### ✅ **Option 1: Add HTTPS to Backend (Best)**

Add SSL/TLS to your backend server:

```bash
# On your server (13.60.14.202)
sudo apt install nginx certbot python3-certbot-nginx

# Setup nginx reverse proxy
sudo nano /etc/nginx/sites-available/whatsapp-backend
```

**nginx config:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Get a domain!

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whatsapp-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Update frontend .env.production
VITE_BACKEND_URL=https://api.yourdomain.com
```

---

### ⚡ **Option 2: Quick Test with Vercel Proxy**

Deploy a serverless proxy on Vercel:

**Create** `frontend/api/proxy.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const backendUrl = 'http://13.60.14.202:4000';
  const path = req.url?.replace('/api/proxy', '') || '';

  const response = await fetch(`${backendUrl}${path}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
```

**Update** `src/config/api.ts`:
```typescript
// In production, use Vercel proxy to avoid mixed content
const isProduction = import.meta.env.PROD;
export const API_BASE_URL = isProduction
  ? '/api/proxy'  // Vercel serverless proxy
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000');
```

---

### 🔧 **Option 3: Disable Mixed Content Protection (Dev Only)**

**Chrome:** `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
- Add: `http://13.60.14.202:4000`
- **⚠️ Only for testing! Not for production users!**

---

## Current Status Summary

✅ **Backend CORS**: Configured
✅ **Frontend env vars**: Ready
✅ **Vite proxy**: Available (optional)
⚠️ **HTTPS/HTTP mixed content**: Needs attention

## Recommendation

**For production launch:**
1. Get a domain name (e.g., from Namecheap, $10/year)
2. Point it to your server: `api.yourdomain.com → 13.60.14.202`
3. Setup nginx + Let's Encrypt (free SSL)
4. Update `VITE_BACKEND_URL=https://api.yourdomain.com`

**For immediate testing:**
- Try Option 2 (Vercel proxy) - quick and works immediately

---

## Quick Test

After deploying, test in your browser console:

```javascript
// Should work if CORS is fixed and mixed content is handled
fetch('http://13.60.14.202:4000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```
