# Security Setup Guide for BMS-Frontend

## Login System Overview

Your Budget Management System now has a secure login system that protects all routes with password authentication.

### Features

✅ **Secure Login Page** - Clean, modern login interface
✅ **Session Management** - Automatic session persistence across page refreshes
✅ **Protected Routes** - All application routes require authentication
✅ **Logout Functionality** - Logout button in navbar
✅ **Environment-based Credentials** - Configure credentials via environment variables

---

## Local Development Setup

### Default Credentials (for development)
```
Username: admin
Password: secure123
```

### Environment Variables

1. **Copy the environment template:**
   ```bash
   # On Windows PowerShell
   Copy-Item .env.example .env.local
   ```

2. **Edit `.env.local` with your preferred credentials:**
   ```env
   VITE_LOGIN_USERNAME=your-username
   VITE_LOGIN_PASSWORD=your-secure-password
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Open `http://localhost:5173/login` in your browser
   - Login with your configured credentials

---

## Azure Deployment Setup

### Step 1: Configure Production Credentials

1. Create a `.env.production` file in your project root:
   ```env
   VITE_LOGIN_USERNAME=your-secure-username
   VITE_LOGIN_PASSWORD=your-very-secure-password
   ```

2. **Important:** Change the default credentials to something strong!
   - Username: Use something unique (not "admin")
   - Password: Use a strong, complex password (min 12 characters)
   - Consider using a password manager

### Step 2: Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Step 3: Deploy to Azure

#### Option A: Using Azure App Service (Recommended)

1. **Create an Azure App Service:**
   ```bash
   # Using Azure CLI
   az appservice plan create --name MyAppServicePlan --resource-group MyResourceGroup --sku B1
   az webapp create --resource-group MyResourceGroup --plan MyAppServicePlan --name my-bms-app
   ```

2. **Deploy using VS Code Azure Tools:**
   - Install "Azure App Service" extension in VS Code
   - Click on Azure icon in the sidebar
   - Right-click on your App Service and select "Deploy to Web App"
   - Select the `dist` folder for deployment

3. **Configure Environment Variables in Azure:**
   - Go to Azure Portal → Your App Service
   - Navigate to **Settings** → **Configuration**
   - Add Application Settings:
     ```
     VITE_LOGIN_USERNAME = your-username
     VITE_LOGIN_PASSWORD = your-strong-password
     ```
   - Click "Save" and the app will restart

#### Option B: Using GitHub Actions

1. **Create `.github/workflows/azure-deploy.yml`:**
   ```yaml
   name: Azure Deployment
   
   on:
     push:
       branches: [main]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         
         - name: Set up Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '18'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           run: npm run build
         
         - name: Deploy to Azure
           uses: azure/webapps-deploy@v2
           with:
             app-name: my-bms-app
             publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
             package: dist
   ```

2. **Add secrets to GitHub:**
   - Go to your repo → Settings → Secrets
   - Add `AZURE_PUBLISH_PROFILE` (download from Azure Portal)

#### Option C: Using Docker

1. **Create `Dockerfile`:**
   ```dockerfile
   FROM node:18-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   ARG VITE_LOGIN_USERNAME=admin
   ARG VITE_LOGIN_PASSWORD=secure123
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and deploy:**
   ```bash
   docker build --build-arg VITE_LOGIN_USERNAME=myuser --build-arg VITE_LOGIN_PASSWORD=mypass -t bms-frontend .
   docker run -p 80:80 bms-frontend
   ```

---

## Security Best Practices

### ✅ DO:
- **Change default credentials** before any deployment
- **Use strong passwords** (12+ characters, mix of uppercase, lowercase, numbers, special chars)
- **Enable HTTPS** - Azure App Service provides free SSL/TLS
- **Use .gitignore** - Never commit `.env.local` or `.env.production`
- **Consider Azure AD** - For production, integrate with Azure Active Directory for better security
- **Set up environment variables** in Azure Portal, not in code
- **Monitor access logs** - Check Azure App Service logs for unauthorized access attempts

### ❌ DON'T:
- ❌ Use "admin" / "password" as credentials
- ❌ Commit `.env` files to version control
- ❌ Share credentials in code or pull requests
- ❌ Use the same password for multiple services
- ❌ Deploy without HTTPS

---

## Advanced: Azure Active Directory Integration

For enterprise-grade security, integrate with Azure AD:

### Install Azure AD packages:
```bash
npm install @azure/msal-browser @azure/msal-react
```

### Update `AuthContext.jsx`:
```javascript
import { useMsal } from "@azure/msal-react";

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  
  // Replace manual login with Azure AD authentication
  const login = async (credentials) => {
    try {
      const response = await instance.loginPopup({
        scopes: ["user.read"]
      });
      // Handle successful login
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  // ... rest of provider
}
```

---

## Testing Your Secure Setup

1. **Test local login:**
   ```bash
   npm run dev
   # Visit http://localhost:5173/login
   # Login with credentials
   # Verify all routes are protected
   ```

2. **Test logout:**
   - Click the logout button in the navbar
   - Verify you're redirected to login page
   - Verify localStorage is cleared (check DevTools)

3. **Test session persistence:**
   - Login to the app
   - Refresh the page
   - Verify you stay logged in

4. **Test protected routes:**
   - Try accessing `/expenses` directly without logging in
   - Verify redirect to login page

---

## Troubleshooting

### Login not working after deployment to Azure

1. Check environment variables in Azure Portal
2. Verify credentials are correct
3. Clear browser cache and localStorage
4. Check Azure App Service logs for errors

### Session not persisting

- Check browser's localStorage is enabled
- Verify browser privacy settings allow localStorage
- Check for any CSP (Content Security Policy) restrictions

### CORS issues with API

- Configure CORS in your backend
- Add backend URL to environment variables
- Update API calls to use `VITE_API_URL` environment variable

---

## Next Steps

1. ✅ Test login locally
2. ✅ Build production bundle: `npm run build`
3. ✅ Deploy to Azure
4. ✅ Change default credentials in Azure Portal
5. ✅ Test login on production URL
6. ✅ Enable HTTPS (automatic with Azure App Service)
7. ✅ Monitor access logs regularly

---

For more information:
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)
