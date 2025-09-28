# Shibboleth Authentication Application

A Node.js Express API with React frontend that integrates with **Shibboleth IdP v3.3.2** for secure SAML 2.0 authentication, specifically designed for LEARN-LK federation compatibility.

## Features

- **Shibboleth IdP v3.3.2 Compatible**: Optimized for LEARN-LK IdP installations
- **SAML 2.0 Authentication**: Full SAML protocol support with HTTP/HTTPS
- **LEARN-LK Attributes**: Handles all required attributes for Zoom and other services
- **JWT Token Management**: Secure token-based authentication with refresh
- **Session Management**: HTTP-only cookies for security
- **eduPerson Schema**: Full support for eduPerson attributes from LDAP
- **Development Ready**: Quick setup for development and testing

## Supported Attributes

This application handles all LEARN-LK federation attributes:

**Required for Zoom/Services:**

- `sn` (surname)
- `email` (mail)
- `uid` (unique username)
- `givenname` (first name)
- `principalName` (eduPersonPrincipalName)
- `eduPersonAffiliation`
- `eduPersonOrgUnitDN`
- `mobile`

**Additional eduPerson Attributes:**

- `displayName`, `schacHomeOrganization`, `eduPersonScopedAffiliation`, `eduPersonEntitlement`

## Requesting Additional Attributes (AttributeConsumingService)

By default only core attributes released by the IdP (often just `mail` / `email`) may appear. To explicitly request more, set an environment variable `REQUESTED_ATTRIBUTES` (comma‑separated) and restart the backend. The server will inject an `<AttributeConsumingService>` block into SP metadata and reference it via `AttributeConsumingServiceIndex="1"` in AuthnRequests.

Example in `backend/.env`:

```
REQUESTED_ATTRIBUTES=givenName,sn,displayName,eduPersonPrincipalName,eduPersonAffiliation,eduPersonScopedAffiliation,eduPersonEntitlement,uid,mail
```

After setting:

1. Restart backend (nodemon reloads) and fetch fresh metadata:
   `curl -s http://localhost:5001/api/auth/metadata > sp-metadata.xml`
2. Provide updated metadata to IdP admin.
3. Ensure IdP `attribute-filter.xml` grants release for those attribute IDs.
4. Re-test login; new attributes will populate `user` object (OID fallbacks handled in code).

Note: The application maps common OIDs automatically:

- givenName → `urn:oid:2.5.4.42`
- sn → `urn:oid:2.5.4.4`
- displayName → `urn:oid:2.16.840.1.113730.3.1.241`
- eduPersonPrincipalName → `urn:oid:1.3.6.1.4.1.5923.1.1.1.6`
- eduPersonAffiliation → `urn:oid:1.3.6.1.4.1.5923.1.1.1.1`
- eduPersonScopedAffiliation → `urn:oid:1.3.6.1.4.1.5923.1.1.1.9`
- eduPersonEntitlement → `urn:oid:1.3.6.1.4.1.5923.1.1.1.7`
- uid → `urn:oid:0.9.2342.19200300.100.1.1`
- mail → `urn:oid:0.9.2342.19200300.100.1.3`

## Prerequisites

- **Node.js v18+**
- **npm or yarn**
- **Shibboleth IdP v3.3.2** on Ubuntu Linux LTS 18.04 (as per LEARN-LK setup)
- **LDAP with eduPerson Schema**

## Quick Setup for Development

If you just want to get running quickly, follow these exact steps in order. A more detailed IdP registration flow (including SP keys) is further below.

### 1. Clone and Install

```bash
git clone https://github.com/achchuthany/ShibbolethLogin.git
cd ShibbolethLogin

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your IdP configuration:

```env
# Basic Configuration
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# Generate JWT Secrets (run these commands to get secure secrets)
# node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
# node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_jwt_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Secret (generate with same method as above)
SESSION_SECRET=your_generated_session_secret_here
SESSION_MAX_AGE=3600000

# Your Shibboleth IdP v3.3.2 Configuration
IDP_SSO_URL=https://idp.YOUR-DOMAIN/idp/profile/SAML2/Redirect/SSO
IDP_SLO_URL=https://idp.YOUR-DOMAIN/idp/profile/SAML2/Redirect/SLO
IDP_METADATA_URL=https://idp.YOUR-DOMAIN/idp/shibboleth

# Service Provider URLs (supports HTTP for development)
SP_ENTITY_ID=http://localhost:5001/metadata
SP_CALLBACK_URL=http://localhost:5001/api/auth/callback
SP_LOGOUT_CALLBACK_URL=http://localhost:5001/api/auth/logout/callback

# IdP Certificate (extract from your IdP metadata)
# curl -s https://idp.YOUR-DOMAIN/idp/shibboleth | sed -n '/<ds:X509Certificate>/,/<\/ds:X509Certificate>/p' | sed 's/<[^>]*>//g' | tr -d '\n\r\t '
IDP_CERT=your_actual_idp_certificate_base64_here

# (Optional) Override NameID format (default is transient)
# SAML_NAMEID_FORMAT=urn:oasis:names:tc:SAML:2.0:nameid-format:transient

# (Add later once SP key pair generated – see Step-by-Step Full Setup section)
# SP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
# SP_CERT=-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----
```

### 3. Extract IdP Certificate

```bash
# Download your IdP metadata and extract certificate
curl -s https://idp.YOUR-DOMAIN/idp/shibboleth > idp-metadata.xml

# Extract the certificate (base64, single line)
sed -n '/<ds:X509Certificate>/,/<\/ds:X509Certificate>/p' idp-metadata.xml | sed 's/<[^>]*>//g' | tr -d '\n\r\t '

# Copy the output and paste it as IDP_CERT value in .env
```

## Running the Application

### Start Both Servers

```bash
# Terminal 1: Start backend (from project root)
cd backend && npm run dev

# Terminal 2: Start frontend (from project root)
cd frontend && npm start
```

### Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **SP Metadata**: http://localhost:5001/api/auth/metadata (for IdP registration)

### Quick Test

1. **Health Check**: `curl http://localhost:5001/api/health`
2. **SP Metadata**: `curl http://localhost:5001/api/auth/metadata`
3. **Login Test**: Visit http://localhost:3000 and click "Login with Shibboleth IdP"

## IdP Registration (Simple)

Use these minimal steps to register the SP (works for localhost or a public tunnel like ngrok).

### Option A: Localhost (for internal / test IdP only)

Not recommended for a remote production IdP. If accepted, generate metadata:

```bash
curl http://localhost:5001/api/auth/metadata > sp-metadata.xml
```

EntityID in this case: `http://localhost:5001/metadata`

### Option B (Recommended): Public Tunnel (ngrok)

1. Start backend, then start ngrok:

```bash
ngrok http 5001
```

2. Set in `backend/.env` (no spaces):

```
SP_ENTITY_ID=https://YOUR-SUBDOMAIN.ngrok-free.dev/metadata
SP_CALLBACK_URL=https://YOUR-SUBDOMAIN.ngrok-free.dev/api/auth/callback
SP_LOGOUT_CALLBACK_URL=https://YOUR-SUBDOMAIN.ngrok-free.dev/api/auth/logout/callback
```

3. Restart backend (nodemon reloads) and regenerate metadata:

```bash
curl http://localhost:5001/api/auth/metadata > sp-ngrok-metadata.xml
```

4. Send file `sp-ngrok-metadata.xml` to IdP admin with required attributes:

```
sn, givenName, uid, mail, eduPersonPrincipalName, eduPersonAffiliation,
eduPersonOrgUnitDN, mobile
```

### IdP Admin Minimal Configuration

1. Copy metadata to IdP (example path):

```bash
sudo cp sp-ngrok-metadata.xml /opt/shibboleth-idp/metadata/app-sp.xml
sudo chown tomcat:tomcat /opt/shibboleth-idp/metadata/app-sp.xml
sudo chmod 640 /opt/shibboleth-idp/metadata/app-sp.xml
```

2. Add to `conf/metadata-providers.xml` (inside root, unique id):

```xml
<MetadataProvider id="AppSP" xsi:type="FilesystemMetadataProvider"
        metadataFile="%{idp.home}/metadata/app-sp.xml" />
```

3. Add relying party in `conf/relying-party.xml`:

```xml
<RelyingParty id="https://YOUR-SUBDOMAIN.ngrok-free.dev/metadata" provider="SAML2">
    <ProfileConfiguration xsi:type="saml:SAML2SSOProfile" includeAttributeStatement="true"/>
</RelyingParty>
```

4. Attribute release in `conf/attribute-filter.xml`:

```xml
<AttributeFilterPolicy id="AppSPRelease">
    <PolicyRequirementRule xsi:type="basic:AttributeRequesterString" value="https://YOUR-SUBDOMAIN.ngrok-free.dev/metadata"/>
    <AttributeRule attributeID="sn"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
    <AttributeRule attributeID="givenName"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
    <AttributeRule attributeID="uid"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
    <AttributeRule attributeID="mail"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
    <AttributeRule attributeID="eduPersonPrincipalName"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
    <AttributeRule attributeID="eduPersonAffiliation"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
    <AttributeRule attributeID="eduPersonOrgUnitDN"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
    <AttributeRule attributeID="mobile"><PermitValueRule xsi:type="basic:ANY"/></AttributeRule>
</AttributeFilterPolicy>
```

5. Reload metadata service or restart IdP:

```bash
/opt/shibboleth-idp/bin/reload-service.sh -id shibboleth.MetadataResolverService || sudo systemctl restart tomcat8
```

### Test

```bash
curl -I http://localhost:5001/api/auth/login  # Should 302 to IdP with SAMLRequest
```

Then complete login in the browser (frontend).

### If ngrok URL changes

Repeat: update .env -> restart backend -> regenerate metadata -> send new file to IdP.

---

## Step-by-Step Full Setup (Recommended for Real IdP)

Follow these numbered steps exactly; do not skip. This adds proper SP keys so the IdP can encrypt assertions (avoids `InvalidSecurityConfiguration`).

### 1. Base Install

```
git clone https://github.com/achchuthany/ShibbolethLogin.git
cd ShibbolethLogin
cd backend && npm install
cd ../frontend && npm install
```

### 2. Create Backend .env

```
cd backend
cp .env.example .env
```

Fill the basics first (do NOT add SP keys yet):

```
PORT=5001
FRONTEND_URL=http://localhost:3000
IDP_SSO_URL=https://idp.YOUR-DOMAIN/idp/profile/SAML2/Redirect/SSO
IDP_SLO_URL=https://idp.YOUR-DOMAIN/idp/profile/SAML2/Redirect/SLO
SP_ENTITY_ID=http://localhost:5001/metadata
SP_CALLBACK_URL=http://localhost:5001/api/auth/callback
SP_LOGOUT_CALLBACK_URL=http://localhost:5001/api/auth/logout/callback
IDP_CERT=<<<paste IdP cert base64 (no spaces) >>>
JWT_SECRET=GENERATED
JWT_REFRESH_SECRET=GENERATED
SESSION_SECRET=GENERATED
# Optional override (default already transient):
# SAML_NAMEID_FORMAT=urn:oasis:names:tc:SAML:2.0:nameid-format:transient
```

Generate secrets (example):

```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run Local Servers

```
cd backend && npm run dev
# new terminal
cd frontend && npm start
```

Check metadata loads: `curl -s http://localhost:5001/api/auth/metadata | head`

### 4. (Optional) Switch to Public URL (ngrok)

```
ngrok http 5001
```

Update these in `.env` (no trailing slashes):

```
SP_ENTITY_ID=https://YOUR-SUBDOMAIN.ngrok-free.dev/metadata
SP_CALLBACK_URL=https://YOUR-SUBDOMAIN.ngrok-free.dev/api/auth/callback
SP_LOGOUT_CALLBACK_URL=https://YOUR-SUBDOMAIN.ngrok-free.dev/api/auth/logout/callback
```

Restart backend. Regenerate metadata:

```
curl -s http://localhost:5001/api/auth/metadata > sp-metadata.xml
```

### 5. Generate SP Key Pair (Required if IdP expects encryption)

```
openssl req -newkey rsa:2048 -nodes -keyout sp.key -x509 -days 825 -out sp.crt -subj "/CN=shibboleth-dev-sp"
```

Add to `.env` (two options):

1. Multi-line (preferred):

```
SP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...key lines...
-----END PRIVATE KEY-----
SP_CERT=-----BEGIN CERTIFICATE-----
...cert lines...
-----END CERTIFICATE-----
```

2. Escaped single-line (if deploying via CI): replace each newline with `\n`.

Restart backend and confirm metadata now contains `KeyDescriptor`:

```
curl -s http://localhost:5001/api/auth/metadata | grep KeyDescriptor || echo "Missing KeyDescriptor"
```

### 6. Send Updated Metadata to IdP Admin

Provide `sp-metadata.xml` plus list of required attributes.

### 7. IdP Config (Summary)

1. Copy metadata file into IdP metadata directory
2. Add FilesystemMetadataProvider entry
3. Add `<RelyingParty>` with SAML2SSOProfile
4. Add attribute filter policy releasing required attributes
5. Reload MetadataResolver service or restart IdP

### 8. Test Login Flow

Browser -> Frontend Login -> Redirect to IdP -> Enter credentials -> Redirect back -> Inspect backend logs for `SAML Profile received`.

### 9. Troubleshooting Toolkit

Enable verbose SAML debug:

```
DEBUG=passport-saml npm run dev
```

Check for these common causes:

- `InvalidSecurityConfiguration`: Missing SP_CERT / SP_PRIVATE_KEY or IdP still using old metadata
- Audience mismatch: EntityID in metadata differs from IdP relying-party entry
- Stale Request: Browser reused old SAMLRequest (open fresh/incognito)
- No attributes: Attribute filter missing or values not in LDAP

### 10. Rotating ngrok URL

If URL changes: update `.env` (three SP\_\* vars) -> restart backend -> regenerate metadata -> re-send to IdP -> wait for reload.

---

## API Endpoints

### Authentication Routes

- `GET /api/auth/login` - Initiate SAML login
- `POST /api/auth/callback` - SAML callback handler
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/metadata` - Service Provider metadata

### Protected Routes

- `GET /api/protected/profile` - Get user profile
- `GET /api/protected/dashboard` - Get dashboard data

## Basic Troubleshooting

### Common Issues

1. **Backend won't start**: Check if port 5001 is already in use
2. **SAML authentication fails**: Verify IDP_CERT is correctly configured
3. **Frontend build issues**: Clear npm cache and reinstall dependencies
4. **"Stale Request" errors**: Clear browser cache and use incognito mode
5. **`InvalidSecurityConfiguration` in IdP logs**: Add SP_PRIVATE_KEY & SP_CERT so metadata advertises KeyDescriptor
6. **No KeyDescriptor in metadata**: Ensure `.env` values loaded (restart) and no stray spaces; verify with curl | grep KeyDescriptor
7. **Responder error (generic)**: Usually upstream IdP failure—check IdP logs and ensure encryption credentials present

### Development Tips

- Check browser console for errors
- Monitor network requests during authentication
- Ensure backend is running before starting frontend

## License

MIT License
