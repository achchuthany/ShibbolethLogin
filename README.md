# Shibboleth Authentication Application

A complete Node.js Express API with React frontend that integrates with Shibboleth IdP for secure authentication using SAML 2.0 protocol.

## Features

- **Shibboleth IdP Integration**: SAML 2.0 authentication with JFN IdP
- **JWT Token Authentication**: Secure token-based authentication
- **Session Management**: HTTP-only cookies for security
- **Token Refresh**: Automatic token refresh functionality
- **Protected Routes**: Route-level authentication protection
- **Responsive UI**: Clean, modern React interface
- **Security Headers**: Helmet.js for security
- **Rate Limiting**: API rate limiting protection

## Architecture

### Backend (Express.js)

- **Authentication Service**: SAML integration with passport-saml
- **Token Service**: JWT token generation and validation
- **Protected Routes**: Middleware-protected API endpoints
- **Security Middleware**: CORS, Helmet, Rate limiting

### Frontend (React)

- **Authentication Context**: Global auth state management
- **Protected Routes**: Route-level authentication
- **API Service**: Axios with automatic token refresh
- **Responsive Design**: Mobile-friendly interface

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to Shibboleth IdP (https://idp.jfn.ac.lk/idp/)

## Installation

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Backend Environment Variables
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Shibboleth IdP Configuration
IDP_SSO_URL=https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO
IDP_SLO_URL=https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SLO
IDP_METADATA_URL=https://idp.jfn.ac.lk/idp/shibboleth
SP_ENTITY_ID=http://localhost:5001/metadata
SP_CALLBACK_URL=http://localhost:5001/api/auth/callback
SP_LOGOUT_CALLBACK_URL=http://localhost:5001/api/auth/logout/callback

# IdP Certificate (Base64 encoded, without BEGIN/END lines, single line)
IDP_CERT=placeholder_certificate_here

# Session Configuration
SESSION_SECRET=your_session_secret_key_here
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in frontend directory:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

## Running the Application

### Development Mode

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. Start the frontend development server:

```bash
cd frontend
npm start
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Detailed Server Configuration Steps

### Step 1: Verify Node.js and npm Installation

```bash
# Check Node.js version (should be v18 or higher)
node --version

# Check npm version
npm --version

# If Node.js is not installed or version is too old:
# Visit https://nodejs.org and download the latest LTS version
```

### Step 2: Backend Server Configuration

1. **Navigate to backend directory and install dependencies**:

```bash
cd backend
npm install
```

2. **Create environment file from template**:

```bash
# Copy the example environment file
cp .env.example .env

# Or create new .env file manually
touch .env
```

3. **Generate JWT secrets**:

```bash
# Generate secure JWT secrets using Node.js
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

4. **Configure the `.env` file with generated secrets**:

```env
# Copy the generated secrets from above into your .env file
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# Use the generated secrets from step 3
JWT_SECRET=your_generated_jwt_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session configuration
SESSION_SECRET=your_generated_session_secret_here
SESSION_MAX_AGE=3600000

# Shibboleth IdP Configuration (JFN University)
IDP_SSO_URL=https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO
IDP_SLO_URL=https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SLO
IDP_METADATA_URL=https://idp.jfn.ac.lk/idp/shibboleth
SP_ENTITY_ID=http://localhost:5001/metadata
SP_CALLBACK_URL=http://localhost:5001/api/auth/callback
SP_LOGOUT_CALLBACK_URL=http://localhost:5001/api/auth/logout/callback

# IdP Certificate (will be configured in next step)
IDP_CERT=
```

5. **Obtain and configure IdP certificate**:

```bash
# Download IdP metadata to extract certificate
curl -o idp-metadata.xml https://idp.jfn.ac.lk/idp/shibboleth

# Extract certificate manually or use the pre-configured certificate
# Update IDP_CERT in .env with the certificate (base64, single line, no headers)
```

6. **Test backend server startup**:

```bash
# Start the backend server
npm run dev

# In another terminal, test if server is running
curl http://localhost:5001/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

7. **Verify SAML configuration**:

```bash
# Test SP metadata generation
curl http://localhost:5001/api/auth/metadata

# Test configuration endpoint
curl http://localhost:5001/api/config

# Test debug endpoint (development only)
curl http://localhost:5001/api/debug/saml
```

### Step 3: Frontend Configuration

1. **Navigate to frontend directory and install dependencies**:

```bash
cd frontend
npm install
```

2. **Create frontend environment file (optional)**:

```bash
# Create .env file in frontend directory
echo "REACT_APP_API_URL=http://localhost:5001" > .env
```

3. **Start frontend development server**:

```bash
npm start
```

4. **Verify frontend is running**:

- Open browser to http://localhost:3000
- Should see the login page
- Check browser console for any errors

### Step 4: Test Complete Setup

1. **Verify both servers are running**:

```bash
# Backend health check
curl http://localhost:5001/api/health

# Frontend access (should show login page)
curl -I http://localhost:3000
```

2. **Test authentication flow**:

```bash
# Test login initiation (should redirect to IdP)
curl -I http://localhost:5001/api/auth/login

# Check SP metadata for IdP registration
curl http://localhost:5001/api/auth/metadata > sp-metadata.xml
```

### Step 5: Database Setup (Optional)

If you plan to store user sessions or additional data:

```bash
# This application uses in-memory sessions by default
# For production, consider adding Redis or database storage

# Example Redis setup (optional):
# npm install connect-redis redis
# Update session configuration in server.js
```

### Step 6: SSL/HTTPS Configuration (Production)

For production deployment:

```bash
# Install SSL certificate
# Update .env with HTTPS URLs
# Configure reverse proxy (nginx/Apache)
# Update IdP registration with production URLs
```

### Step 7: Firewall and Security Configuration

```bash
# Ensure required ports are open:
# - Port 5001 (backend API)
# - Port 3000 (frontend development)
# - Port 443 (HTTPS for production)

# Ubuntu/Debian example:
sudo ufw allow 5001
sudo ufw allow 3000
sudo ufw allow 443
```

### Step 8: Process Management (Production)

```bash
# Install PM2 for process management
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'shibboleth-backend',
    script: './src/server-alt.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 9: Monitoring and Logs

```bash
# View application logs
tail -f backend/server.log

# Monitor process with PM2 (if installed)
pm2 logs shibboleth-backend
pm2 monit

# Check system resources
htop
df -h
```

### Step 10: Backup and Maintenance

```bash
# Backup important configuration files
cp backend/.env backend/.env.backup
cp -r backend/src backend/src.backup

# Regular maintenance tasks
npm audit
npm update
```

## Server Startup Checklist

### Pre-Startup Verification

- [ ] **Node.js**: Version 18+ installed (`node --version`)
- [ ] **Dependencies**: Backend installed (`cd backend && npm list`)
- [ ] **Dependencies**: Frontend installed (`cd frontend && npm list`)
- [ ] **Environment**: `.env` file exists in backend directory
- [ ] **Secrets**: JWT secrets generated and configured
- [ ] **Certificate**: IdP certificate configured in `.env`
- [ ] **Ports**: 5001 and 3000 available (`lsof -i :5001,3000`)

### Startup Sequence

1. **Start Backend First**:

   ```bash
   cd backend
   npm run dev
   # Wait for: "Server running on http://localhost:5001"
   ```

2. **Verify Backend Health**:

   ```bash
   curl http://localhost:5001/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

3. **Start Frontend**:

   ```bash
   cd frontend
   npm start
   # Wait for: "webpack compiled with 0 errors"
   ```

4. **Final Verification**:
   ```bash
   # Test complete application stack
   curl -I http://localhost:3000  # Frontend
   curl http://localhost:5001/api/health  # Backend API
   curl http://localhost:5001/api/auth/metadata  # SAML metadata
   ```

### Post-Startup Testing

- [ ] **Frontend loads**: http://localhost:3000 shows login page
- [ ] **Backend API**: http://localhost:5001/api/health returns OK
- [ ] **SAML metadata**: http://localhost:5001/api/auth/metadata returns XML
- [ ] **Login redirect**: Login button redirects to JFN IdP
- [ ] **No console errors**: Browser dev tools show no errors
- [ ] **Server logs**: No error messages in terminal/logs

### Quick Start Commands

```bash
# One-command setup (run from project root)
(cd backend && npm install && npm run dev) &
(cd frontend && npm install && npm start) &

# Wait for both servers to start, then test
sleep 10 && curl http://localhost:5001/api/health && curl -I http://localhost:3000
```

### Production Mode

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Start the backend:

```bash
cd backend
npm start
```

## API Endpoints

### Authentication Routes (`/api/auth`)

- `GET /login` - Initiate SAML login
- `POST /callback` - SAML callback handler
- `GET /status` - Check authentication status
- `POST /refresh` - Refresh JWT tokens
- `POST /logout` - Logout user
- `GET /slo` - Initiate SAML logout
- `POST /logout/callback` - SAML logout callback
- `GET /metadata` - Service Provider metadata

### Protected Routes (`/api/protected`)

- `GET /profile` - Get user profile
- `GET /dashboard` - Get dashboard data
- `GET /settings` - Get user settings

## Configuration

### Shibboleth IdP Server Configuration

This section provides step-by-step instructions for configuring your Shibboleth IdP server to handle authentication requests and responses from your Service Provider (SP), following SAML 2.0 best practices and security guidelines.

#### Prerequisites for IdP Configuration

Before configuring the IdP integration, ensure you have:

- [ ] **Shibboleth IdP Version**: v4.0+ recommended for security
- [ ] **SSL/TLS Certificate**: Valid certificate for HTTPS communication
- [ ] **Time Synchronization**: NTP configured on both SP and IdP servers
- [ ] **Administrative Access**: Contact information for IdP administrator
- [ ] **Network Connectivity**: Firewall rules allowing SAML traffic

#### Step 1: Obtain and Validate IdP Certificate and Metadata

1. **Download and Verify IdP Metadata**:

   ```bash
   # Download IdP metadata with SSL verification
   curl -s --fail --max-time 30 https://idp.jfn.ac.lk/idp/shibboleth > idp-metadata.xml

   # Verify metadata is valid XML
   xmllint --noout idp-metadata.xml && echo "✓ Valid XML" || echo "✗ Invalid XML"

   # Check metadata expiration date
   grep -o 'validUntil="[^"]*"' idp-metadata.xml

   # Verify IdP certificate validity
   openssl x509 -noout -dates -in <(sed -n '/<ds:X509Certificate>/,/<\/ds:X509Certificate>/p' idp-metadata.xml | sed 's/<[^>]*>//g' | tr -d '\n\r\t ' | fold -w 64 | sed '1i-----BEGIN CERTIFICATE-----' | sed '$a-----END CERTIFICATE-----')
   ```

2. **Extract Certificate Safely**:

   ```bash
   # Extract certificate from metadata (automated approach)
   CERT=$(sed -n '/<ds:X509Certificate>/,/<\/ds:X509Certificate>/p' idp-metadata.xml | sed 's/<[^>]*>//g' | tr -d '\n\r\t ')

   # Validate certificate format
   echo $CERT | base64 -d > /dev/null && echo "✓ Valid base64" || echo "✗ Invalid base64"

   # Store certificate securely
   echo "IDP_CERT=$CERT" >> backend/.env.tmp
   echo "Certificate extracted. Review backend/.env.tmp and update .env manually"
   ```

3. **Secure Certificate Storage**:

   ```bash
   # Set proper file permissions for .env
   chmod 600 backend/.env

   # Verify certificate is not exposed in version control
   echo "backend/.env" >> .gitignore

   # Create backup of working configuration
   cp backend/.env backend/.env.backup.$(date +%Y%m%d)
   ```

#### Step 2: Generate and Validate Service Provider Metadata

1. **Start your backend server with proper configuration**:

   ```bash
   cd backend

   # Verify environment configuration first
   node -e "require('dotenv').config(); console.log('SP_ENTITY_ID:', process.env.SP_ENTITY_ID || 'MISSING'); console.log('IDP_CERT:', process.env.IDP_CERT ? 'CONFIGURED' : 'MISSING');"

   # Start server
   npm run dev

   # Wait for server to be ready
   sleep 3 && curl -s http://localhost:5001/api/health | grep -q "ok" && echo "✓ Server ready" || echo "✗ Server not ready"
   ```

2. **Generate and Validate SP Metadata**:

   ```bash
   # Generate SP metadata
   curl -s http://localhost:5001/api/auth/metadata > sp-metadata.xml

   # Validate generated metadata is well-formed XML
   xmllint --noout sp-metadata.xml && echo "✓ Valid SP metadata XML" || echo "✗ Invalid XML"

   # Verify metadata contains required elements
   echo "=== SP Metadata Validation ==="
   grep -q "EntityDescriptor" sp-metadata.xml && echo "✓ EntityDescriptor found" || echo "✗ Missing EntityDescriptor"
   grep -q "AssertionConsumerService" sp-metadata.xml && echo "✓ ACS endpoint found" || echo "✗ Missing ACS endpoint"
   grep -q "SingleLogoutService" sp-metadata.xml && echo "✓ SLO endpoint found" || echo "✗ Missing SLO endpoint"

   # Extract key metadata information
   echo "=== SP Configuration Details ==="
   echo "Entity ID: $(grep -o 'entityID="[^"]*"' sp-metadata.xml | cut -d'"' -f2)"
   echo "ACS URL: $(grep -o 'Location="[^"]*"' sp-metadata.xml | grep callback | cut -d'"' -f2)"
   echo "SLO URL: $(grep -o 'Location="[^"]*"' sp-metadata.xml | grep logout | cut -d'"' -f2)"
   ```

3. **Security Validation Checklist**:

   ```bash
   # Check for security best practices in metadata
   echo "=== Security Validation ==="

   # Verify HTTPS URLs (production requirement)
   if grep -q "http://localhost" sp-metadata.xml; then
       echo "⚠ Using HTTP (development only) - Change to HTTPS for production"
   else
       echo "✓ Using HTTPS URLs"
   fi

   # Check for proper binding
   grep -q "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" sp-metadata.xml && echo "✓ HTTP-POST binding configured" || echo "⚠ Consider HTTP-POST binding"

   # Verify signing is configured
   grep -q "WantAssertionsSigned" sp-metadata.xml && echo "✓ Assertion signing requested" || echo "⚠ Consider requiring signed assertions"
   ```

#### Step 3: Register Service Provider with IdP (Best Practices)

**Prepare Comprehensive Registration Package for IdP Administrator:**

1. **Service Provider Registration Form**:

   Create a detailed registration request including:

   ```markdown
   ## SP Registration Request for JFN IdP

   ### Administrative Details

   - **Organization**: [Your Organization Name]
   - **Entity ID**: http://localhost:5001/metadata (Dev) / https://your-domain.com/metadata (Prod)
   - **Application Name**: [Your Application Name]
   - **Purpose**: [Brief description of application purpose]
   - **Technical Contact**: [Your Name] <[your-email]>
   - **Administrative Contact**: [Admin Name] <[admin-email]>
   - **Security Contact**: [Security Officer] <[security-email]>

   ### Technical Requirements

   - **SAML Version**: 2.0
   - **Binding**: HTTP-POST (primary), HTTP-Redirect (fallback)
   - **NameID Format**: urn:oasis:names:tc:SAML:2.0:nameid-format:transient
   - **Assertion Encryption**: Preferred (provide encryption certificate if required)
   - **Assertion Signing**: Required
   - **Session Timeout**: 30 minutes (configurable)
   ```

2. **Required Attachments**:

   ```bash
   # Prepare registration package
   mkdir sp-registration-package

   # Include SP metadata
   cp sp-metadata.xml sp-registration-package/

   # Create attribute requirements document
   cat > sp-registration-package/attribute-requirements.txt << EOF
   Required Attributes (Essential):
   - eduPersonPrincipalName (unique identifier) - REQUIRED
   - mail (email address) - REQUIRED
   - displayName (full name) - REQUIRED

   Optional Attributes:
   - givenName (first name)
   - sn (surname/last name)
   - eduPersonAffiliation (user role/affiliation)
   - eduPersonScopedAffiliation (scoped affiliation)
   - eduPersonEntitlement (entitlements/permissions)
   - ou (organizational unit)
   - telephoneNumber (phone number)
   EOF

   # Create network requirements document
   cat > sp-registration-package/network-requirements.txt << EOF
   Network Requirements:
   - Source IPs: [Your server IPs]
   - Firewall rules: Allow HTTPS (443) from SP to IdP
   - Time sync: NTP configured
   - DNS: Proper forward/reverse DNS resolution
   EOF
   ```

3. **Security Requirements and Certifications**:

   ```bash
   # Generate SP signing certificate (if required)
   # Note: Some IdPs require SP to have signing certificates

   # Create certificate request template
   cat > sp-registration-package/security-requirements.txt << EOF
   Security Requirements:
   - Transport Security: TLS 1.2+ required
   - Message Security: Signed assertions required
   - Attribute Encryption: Optional but preferred
   - Session Security: HTTP-only cookies, secure flags
   - Clock Skew Tolerance: ±5 minutes
   - Certificate Validity: Monitor expiration dates

   Compliance:
   - Data Protection: GDPR/local privacy laws compliant
   - Logging: Authentication events logged
   - Access Control: Role-based access implemented
   EOF
   ```

4. **Environment-Specific Configurations**:

   ```bash
   # Development Environment
   echo "=== Development Configuration ===" >> sp-registration-package/environments.txt
   echo "Entity ID: http://localhost:5001/metadata" >> sp-registration-package/environments.txt
   echo "ACS URL: http://localhost:5001/api/auth/callback" >> sp-registration-package/environments.txt
   echo "SLO URL: http://localhost:5001/api/auth/logout/callback" >> sp-registration-package/environments.txt
   echo "" >> sp-registration-package/environments.txt

   # Production Environment (template)
   echo "=== Production Configuration ===" >> sp-registration-package/environments.txt
   echo "Entity ID: https://your-domain.com/metadata" >> sp-registration-package/environments.txt
   echo "ACS URL: https://your-domain.com/api/auth/callback" >> sp-registration-package/environments.txt
   echo "SLO URL: https://your-domain.com/api/auth/logout/callback" >> sp-registration-package/environments.txt
   ```

5. **Communication Template**:

   ```bash
   # Create email template for IdP administrator
   cat > sp-registration-package/email-template.txt << EOF
   Subject: Service Provider Registration Request - [Your Application Name]

   Dear JFN IdP Administrator,

   We request registration of our Service Provider with the JFN Identity Provider.

   Application Details:
   - Name: [Your Application Name]
   - Purpose: [Brief description]
   - Environment: Development/Testing (Production to follow)

   Attached Documents:
   - SP metadata (sp-metadata.xml)
   - Attribute requirements
   - Security requirements
   - Network requirements

   Timeline:
   - Development/Testing: Immediate
   - Production deployment: [Expected date]

   Please confirm:
   1. Registration approval
   2. Attribute release configuration
   3. Testing timeline
   4. Production migration process

   Contact: [Your contact information]

   Best regards,
   [Your name and title]
   EOF
   ```

#### Step 4: IdP Configuration Steps (For IdP Administrator - Best Practices)

**Comprehensive IdP Configuration Guide for Administrator:**

1. **Metadata Provider Configuration** (Primary Step):

   ```xml
   <!-- In metadata-providers.xml - Add SP metadata source -->

   <!-- Option 1: Local metadata file (recommended for production) -->
   <MetadataProvider id="LocalSPMetadata" xsi:type="FilesystemMetadataProvider"
                     metadataFile="/opt/shibboleth-idp/metadata/sp-metadata.xml">
       <MetadataFilter xsi:type="RequiredValidUntil" maxValidityInterval="P30D" />
       <MetadataFilter xsi:type="SignatureValidation" requireSignedRoot="false" />
   </MetadataProvider>

   <!-- Option 2: Dynamic metadata (development) -->
   <MetadataProvider id="DynamicSPMetadata" xsi:type="LocalDynamicMetadataProvider">
       <MetadataResource file="/opt/shibboleth-idp/metadata/your-app-sp-metadata.xml" />
   </MetadataProvider>

   <!-- Option 3: Remote metadata (with caching) -->
   <MetadataProvider id="RemoteSPMetadata" xsi:type="HTTPMetadataProvider"
                     metadataURL="https://your-domain.com/api/auth/metadata"
                     tlsTrustEngineRef="shibboleth.StaticExplicitTrustEngine"
                     refreshDelayFactor="0.125"
                     maxRefreshDelay="PT2H">
       <MetadataFilter xsi:type="RequiredValidUntil" maxValidityInterval="P7D" />
   </MetadataProvider>
   ```

2. **Relying Party Configuration** (Security-Enhanced):

   ```xml
   <!-- In relying-party.xml -->
   <bean id="your-app-sp" parent="RelyingPartyByName">
       <constructor-arg name="candidates">
           <list>
               <value>http://localhost:5001/metadata</value>
               <value>https://your-domain.com/metadata</value>
           </list>
       </constructor-arg>
       <property name="profileConfigurations">
           <list>
               <!-- SAML 2.0 SSO with security settings -->
               <bean parent="SAML2.SSO" p:postAuthenticationFlows="attribute-release">
                   <property name="securityConfiguration">
                       <bean parent="shibboleth.SecurityConfiguration.SAML2">
                           <!-- Require signed assertions -->
                           <property name="signAssertions" value="true" />
                           <!-- Optional: Encrypt assertions -->
                           <property name="encryptAssertions" value="false" />
                           <!-- Set assertion lifetime -->
                           <property name="assertionLifetime" value="PT5M" />
                           <!-- Configure response conditions -->
                           <property name="includeConditionsNotBefore" value="true" />
                       </bean>
                   </property>
               </bean>

               <!-- SAML 2.0 Single Logout -->
               <bean parent="SAML2.SLO" />

               <!-- Optional: SAML 2.0 Artifact Resolution -->
               <bean parent="SAML2.ArtifactResolution" />
           </list>
       </property>

       <!-- Default authentication methods -->
       <property name="defaultAuthenticationMethods">
           <list>
               <value>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</value>
           </list>
       </property>
   </bean>
   ```

3. **Attribute Release Policy** (Comprehensive):

   ```xml
   <!-- In attribute-filter.xml -->
   <AttributeFilterPolicy id="your-app-comprehensive-release">
       <PolicyRequirementRule xsi:type="Requester"
                              value="http://localhost:5001/metadata" />

       <!-- Essential Attributes -->
       <AttributeRule attributeID="eduPersonPrincipalName">
           <PermitValueRule xsi:type="ANY" />
       </AttributeRule>

       <AttributeRule attributeID="mail">
           <PermitValueRule xsi:type="ANY" />
       </AttributeRule>

       <AttributeRule attributeID="displayName">
           <PermitValueRule xsi:type="ANY" />
       </AttributeRule>

       <!-- Extended Attributes -->
       <AttributeRule attributeID="givenName">
           <PermitValueRule xsi:type="ANY" />
       </AttributeRule>

       <AttributeRule attributeID="sn">
           <PermitValueRule xsi:type="ANY" />
       </AttributeRule>

       <!-- Conditional Attributes -->
       <AttributeRule attributeID="eduPersonAffiliation">
           <PermitValueRule xsi:type="ValueRegex" regex="^(student|faculty|staff|employee)$" />
       </AttributeRule>

       <AttributeRule attributeID="eduPersonScopedAffiliation">
           <PermitValueRule xsi:type="ValueRegex" regex=".*@jfn\.ac\.lk$" />
       </AttributeRule>

       <!-- Optional: Role-based attributes -->
       <AttributeRule attributeID="eduPersonEntitlement">
           <PermitValueRule xsi:type="ValueRegex" regex="^urn:mace:.*" />
       </AttributeRule>
   </AttributeFilterPolicy>

   <!-- Production-specific policy -->
   <AttributeFilterPolicy id="your-app-production-release">
       <PolicyRequirementRule xsi:type="Requester"
                              value="https://your-domain.com/metadata" />
       <!-- Same attribute rules as above -->
   </AttributeFilterPolicy>
   ```

4. **Attribute Resolver Configuration**:

   ```xml
   <!-- In attribute-resolver.xml -->
   <!-- Ensure required attributes are resolved -->

   <!-- Example: Scoped affiliation -->
   <AttributeDefinition id="eduPersonScopedAffiliation" xsi:type="Scoped" scope="jfn.ac.lk">
       <InputDataConnector ref="myLDAP" attributeNames="eduPersonAffiliation" />
   </AttributeDefinition>

   <!-- Example: Principal name -->
   <AttributeDefinition id="eduPersonPrincipalName" xsi:type="Scoped" scope="jfn.ac.lk">
       <InputDataConnector ref="myLDAP" attributeNames="uid" />
   </AttributeDefinition>
   ```

5. **Security and Logging Configuration**:

   ```xml
   <!-- In logging.xml - Add SP-specific logging -->
   <logger name="org.opensaml.saml.saml2.binding" level="DEBUG" />
   <logger name="net.shibboleth.idp.saml.saml2.profile" level="INFO" />
   <logger name="net.shibboleth.idp.attribute.filter" level="INFO" />

   <!-- Add appender for SP-specific logs -->
   <appender name="SP_AUDIT" class="ch.qos.logback.core.rolling.RollingFileAppender">
       <file>/opt/shibboleth-idp/logs/sp-audit.log</file>
       <encoder>
           <pattern>%date{ISO8601} - %level [%logger] - %msg%n</pattern>
       </encoder>
       <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
           <fileNamePattern>/opt/shibboleth-idp/logs/sp-audit.%d{yyyy-MM-dd}.log</fileNamePattern>
           <maxHistory>30</maxHistory>
       </rollingPolicy>
   </appender>
   ```

6. **IdP Administrator Checklist**:

   ```bash
   # Post-configuration verification checklist
   echo "=== IdP Configuration Checklist ==="
   echo "[ ] SP metadata imported and validated"
   echo "[ ] Relying party configuration added"
   echo "[ ] Attribute release policy configured"
   echo "[ ] Attribute resolver updated (if needed)"
   echo "[ ] Logging configuration updated"
   echo "[ ] IdP service reloaded/restarted"
   echo "[ ] Test authentication performed"
   echo "[ ] Attribute release verified"
   echo "[ ] Production migration plan created"
   ```

#### Step 5: Comprehensive Testing and Validation

1. **Pre-Integration Testing**:

   ```bash
   # Create comprehensive test script
   cat > test-saml-integration.sh << 'EOF'
   #!/bin/bash
   echo "=== SAML Integration Test Suite ==="

   # Test 1: SP Metadata Validation
   echo "1. Testing SP metadata generation..."
   curl -s -o sp-test-metadata.xml http://localhost:5001/api/auth/metadata
   if xmllint --noout sp-test-metadata.xml 2>/dev/null; then
       echo "✓ SP metadata is valid XML"
   else
       echo "✗ SP metadata XML validation failed"
       exit 1
   fi

   # Test 2: Required endpoints
   echo "2. Testing required endpoints..."
   curl -s -I http://localhost:5001/api/health | grep -q "200 OK" && echo "✓ Health endpoint" || echo "✗ Health endpoint failed"
   curl -s -I http://localhost:5001/api/auth/metadata | grep -q "200 OK" && echo "✓ Metadata endpoint" || echo "✗ Metadata endpoint failed"

   # Test 3: Login initiation
   echo "3. Testing login initiation..."
   REDIRECT=$(curl -s -I http://localhost:5001/api/auth/login | grep -i location | cut -d' ' -f2 | tr -d '\r')
   if echo "$REDIRECT" | grep -q "idp.jfn.ac.lk"; then
       echo "✓ Login redirects to JFN IdP"
   else
       echo "✗ Login redirect failed or incorrect URL: $REDIRECT"
   fi

   # Test 4: IdP availability
   echo "4. Testing IdP availability..."
   if curl -s --connect-timeout 10 https://idp.jfn.ac.lk/idp/shibboleth | grep -q "EntityDescriptor"; then
       echo "✓ IdP metadata accessible"
   else
       echo "⚠ IdP may be unreachable or maintenance mode"
   fi

   # Test 5: Certificate validation
   echo "5. Testing certificate configuration..."
   if grep -q "IDP_CERT=" backend/.env && [ -n "$(grep IDP_CERT= backend/.env | cut -d'=' -f2)" ]; then
       echo "✓ IdP certificate configured"
   else
       echo "✗ IdP certificate missing in .env"
   fi

   echo "=== Test Summary ==="
   echo "Run this script before attempting full authentication flow"
   EOF

   chmod +x test-saml-integration.sh
   ./test-saml-integration.sh
   ```

2. **Manual Authentication Flow Testing**:

   ```bash
   # Step-by-step manual testing guide
   echo "=== Manual Authentication Test Procedure ==="
   echo "1. Open browser to http://localhost:3000"
   echo "2. Click 'Login with Shibboleth IdP'"
   echo "3. Verify redirect to: https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO"
   echo "4. Enter JFN credentials"
   echo "5. Check for successful redirect back to application"
   echo "6. Verify user attributes are received and displayed"
   echo "7. Test logout functionality"
   echo "8. Verify session cleanup"
   ```

3. **Browser-Based Testing Checklist**:

   ```bash
   # Create browser testing checklist
   cat > browser-test-checklist.md << 'EOF'
   # Browser Testing Checklist

   ## Before Testing
   - [ ] Clear browser cache and cookies
   - [ ] Use incognito/private browsing mode
   - [ ] Have JFN credentials ready
   - [ ] Open browser developer tools

   ## Authentication Flow
   - [ ] Application loads at localhost:3000
   - [ ] Login button is visible and clickable
   - [ ] Redirect to JFN IdP occurs (no errors)
   - [ ] IdP login form displays correctly
   - [ ] Credentials accepted by IdP
   - [ ] Redirect back to application succeeds
   - [ ] User attributes display correctly
   - [ ] Dashboard/protected content loads

   ## Error Scenarios
   - [ ] Test with incorrect credentials
   - [ ] Test session timeout
   - [ ] Test browser back button (should not cause issues)
   - [ ] Test direct access to protected routes

   ## Logout Testing
   - [ ] Logout button works
   - [ ] Session cleared locally
   - [ ] Redirect to IdP logout (if configured)
   - [ ] Unable to access protected content after logout
   - [ ] Fresh login required

   ## Cross-Browser Testing
   - [ ] Chrome/Chromium
   - [ ] Firefox
   - [ ] Safari (macOS)
   - [ ] Edge (Windows)
   EOF
   ```

4. **Network and Security Testing**:

   ```bash
   # Network connectivity and security tests
   echo "=== Network Security Tests ==="

   # Test SSL/TLS configuration
   echo "Testing IdP SSL configuration..."
   openssl s_client -connect idp.jfn.ac.lk:443 -servername idp.jfn.ac.lk < /dev/null 2>/dev/null | openssl x509 -noout -dates

   # Test CORS headers
   echo "Testing CORS configuration..."
   curl -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -X OPTIONS http://localhost:5001/api/auth/login

   # Test rate limiting
   echo "Testing rate limiting..."
   for i in {1..5}; do
       curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5001/api/health
   done
   ```

5. **Automated Integration Testing**:

   ```bash
   # Create automated test suite
   cat > automated-integration-test.js << 'EOF'
   const axios = require('axios');
   const cheerio = require('cheerio');

   async function testSAMLIntegration() {
       console.log('=== Automated SAML Integration Test ===');

       try {
           // Test 1: Metadata endpoint
           const metadataResponse = await axios.get('http://localhost:5001/api/auth/metadata');
           console.log('✓ Metadata endpoint accessible');

           // Test 2: Login initiation
           const loginResponse = await axios.get('http://localhost:5001/api/auth/login', {
               maxRedirects: 0,
               validateStatus: status => status === 302
           });
           console.log('✓ Login initiation redirects correctly');

           // Test 3: Health check
           const healthResponse = await axios.get('http://localhost:5001/api/health');
           if (healthResponse.data.status === 'ok') {
               console.log('✓ Health check passed');
           }

           console.log('All automated tests passed!');
       } catch (error) {
           console.error('✗ Test failed:', error.message);
       }
   }

   testSAMLIntegration();
   EOF

   # Run if Node.js dependencies are available
   if command -v node &> /dev/null && npm list axios &> /dev/null; then
       node automated-integration-test.js
   else
       echo "Install dependencies: npm install axios cheerio"
   fi
   ```

#### Step 6: Production Deployment (Security Best Practices)

**Production deployment requires careful security configuration and testing:**

1. **Pre-Production Security Audit**:

   ```bash
   # Create production readiness checklist
   cat > production-readiness-checklist.md << 'EOF'
   # Production Readiness Checklist

   ## Security Requirements
   - [ ] Valid SSL/TLS certificate installed (not self-signed)
   - [ ] TLS 1.2+ enabled, older versions disabled
   - [ ] HTTPS enforced for all endpoints
   - [ ] Strong JWT secrets generated (64+ characters)
   - [ ] Environment variables properly secured
   - [ ] No sensitive data in version control
   - [ ] Security headers configured (Helmet.js)
   - [ ] Rate limiting enabled and tested
   - [ ] CORS properly configured for production origins

   ## Infrastructure Requirements
   - [ ] Load balancer configured (if applicable)
   - [ ] Reverse proxy configured (nginx/Apache)
   - [ ] Database configured (if not using in-memory sessions)
   - [ ] Redis configured for session storage (recommended)
   - [ ] Backup and disaster recovery plan
   - [ ] Monitoring and alerting configured
   - [ ] Log rotation configured
   - [ ] Firewall rules configured

   ## SAML-Specific Requirements
   - [ ] Production SP metadata generated and validated
   - [ ] IdP administrator contacted for production registration
   - [ ] Production attribute release tested
   - [ ] Clock synchronization verified (NTP)
   - [ ] Certificate expiration monitoring configured
   EOF
   ```

2. **Production Environment Configuration**:

   ```bash
   # Generate production-ready configuration
   cat > backend/.env.production << 'EOF'
   # Production Environment Configuration
   NODE_ENV=production
   PORT=443

   # Frontend Configuration
   FRONTEND_URL=https://your-domain.com

   # Generate strong secrets for production
   # Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   JWT_SECRET=YOUR_SUPER_SECURE_64_CHAR_JWT_SECRET_HERE
   JWT_REFRESH_SECRET=YOUR_SUPER_SECURE_64_CHAR_REFRESH_SECRET_HERE
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Session Configuration (Production)
   SESSION_SECRET=YOUR_SUPER_SECURE_64_CHAR_SESSION_SECRET_HERE
   SESSION_MAX_AGE=1800000  # 30 minutes
   SESSION_SECURE=true      # HTTPS only
   SESSION_HTTP_ONLY=true   # Prevent XSS

   # Production SAML Configuration
   IDP_SSO_URL=https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO
   IDP_SLO_URL=https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SLO
   IDP_METADATA_URL=https://idp.jfn.ac.lk/idp/shibboleth

   # Production SP URLs
   SP_ENTITY_ID=https://your-domain.com/metadata
   SP_CALLBACK_URL=https://your-domain.com/api/auth/callback
   SP_LOGOUT_CALLBACK_URL=https://your-domain.com/api/auth/logout/callback

   # IdP Certificate (same as development, verify expiration)
   IDP_CERT=YOUR_IDP_CERTIFICATE_HERE

   # Security Headers
   HELMET_ENABLED=true
   RATE_LIMIT_ENABLED=true
   CORS_ORIGIN=https://your-domain.com

   # Logging
   LOG_LEVEL=info
   LOG_FILE=/var/log/shibboleth-app/app.log
   AUDIT_LOG_ENABLED=true
   EOF
   ```

3. **SSL/TLS Configuration**:

   ```bash
   # SSL certificate setup
   echo "=== SSL Certificate Setup ==="

   # Option 1: Let's Encrypt (free)
   # Install certbot and obtain certificate
   echo "For Let's Encrypt:"
   echo "sudo certbot --nginx -d your-domain.com"

   # Option 2: Commercial certificate
   echo "For commercial certificate:"
   echo "1. Generate CSR: openssl req -new -newkey rsa:2048 -nodes -keyout domain.key -out domain.csr"
   echo "2. Submit CSR to CA"
   echo "3. Install certificate and intermediate chain"

   # SSL configuration test
   cat > test-ssl-config.sh << 'EOF'
   #!/bin/bash
   echo "Testing SSL configuration..."

   # Test SSL certificate
   openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

   # Test TLS version support
   echo "Testing TLS versions:"
   openssl s_client -connect your-domain.com:443 -tls1_2 < /dev/null 2>/dev/null && echo "✓ TLS 1.2 supported"
   openssl s_client -connect your-domain.com:443 -tls1_3 < /dev/null 2>/dev/null && echo "✓ TLS 1.3 supported"

   # Test cipher suites
   nmap --script ssl-enum-ciphers -p 443 your-domain.com
   EOF
   chmod +x test-ssl-config.sh
   ```

4. **Production Deployment Script**:

   ```bash
   # Create production deployment script
   cat > deploy-production.sh << 'EOF'
   #!/bin/bash
   set -e

   echo "=== Production Deployment Script ==="

   # Pre-deployment checks
   echo "1. Running pre-deployment checks..."

   # Check if production config exists
   if [ ! -f "backend/.env.production" ]; then
       echo "✗ Production environment file missing"
       exit 1
   fi

   # Backup current configuration
   echo "2. Backing up current configuration..."
   mkdir -p backups/$(date +%Y%m%d_%H%M%S)
   cp -r backend/ backups/$(date +%Y%m%d_%H%M%S)/

   # Build frontend for production
   echo "3. Building frontend..."
   cd frontend
   npm run build
   cd ..

   # Install production dependencies
   echo "4. Installing production dependencies..."
   cd backend
   npm ci --only=production

   # Copy production environment
   cp .env.production .env

   # Set proper file permissions
   chmod 600 .env
   chown $(whoami):$(whoami) .env

   # Test production configuration
   echo "5. Testing production configuration..."
   npm run test:config || true

   # Start application with PM2
   echo "6. Starting application with PM2..."
   pm2 start ecosystem.config.js --env production
   pm2 save

   echo "✓ Production deployment completed"
   echo "Monitor logs: pm2 logs"
   echo "Check status: pm2 status"
   EOF
   chmod +x deploy-production.sh
   ```

5. **Production Testing and Validation**:

   ```bash
   # Production validation script
   cat > validate-production.sh << 'EOF'
   #!/bin/bash
   DOMAIN="your-domain.com"

   echo "=== Production Validation ==="

   # Test 1: HTTPS endpoints
   echo "1. Testing HTTPS endpoints..."
   curl -s -I https://$DOMAIN/api/health | grep -q "200 OK" && echo "✓ Health endpoint" || echo "✗ Health endpoint failed"
   curl -s -I https://$DOMAIN/api/auth/metadata | grep -q "200 OK" && echo "✓ Metadata endpoint" || echo "✗ Metadata endpoint failed"

   # Test 2: Security headers
   echo "2. Testing security headers..."
   HEADERS=$(curl -s -I https://$DOMAIN/api/health)
   echo "$HEADERS" | grep -q "X-Frame-Options" && echo "✓ X-Frame-Options header" || echo "⚠ Missing X-Frame-Options"
   echo "$HEADERS" | grep -q "X-Content-Type-Options" && echo "✓ X-Content-Type-Options header" || echo "⚠ Missing X-Content-Type-Options"
   echo "$HEADERS" | grep -q "Strict-Transport-Security" && echo "✓ HSTS header" || echo "⚠ Missing HSTS header"

   # Test 3: SAML authentication flow
   echo "3. Testing SAML authentication flow..."
   REDIRECT=$(curl -s -I https://$DOMAIN/api/auth/login | grep -i location | cut -d' ' -f2 | tr -d '\r')
   if echo "$REDIRECT" | grep -q "idp.jfn.ac.lk"; then
       echo "✓ Authentication redirects to JFN IdP"
   else
       echo "✗ Authentication redirect failed"
   fi

   # Test 4: SSL certificate
   echo "4. Testing SSL certificate..."
   openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates

   echo "=== Validation Complete ==="
   EOF
   chmod +x validate-production.sh
   ```

6. **Post-Deployment Monitoring**:

   ```bash
   # Set up monitoring
   cat > setup-monitoring.sh << 'EOF'
   #!/bin/bash
   echo "=== Setting up Production Monitoring ==="

   # Log monitoring
   echo "Setting up log monitoring..."
   mkdir -p /var/log/shibboleth-app
   touch /var/log/shibboleth-app/app.log
   touch /var/log/shibboleth-app/access.log
   touch /var/log/shibboleth-app/error.log

   # Logrotate configuration
   cat > /etc/logrotate.d/shibboleth-app << LOGROTATE
   /var/log/shibboleth-app/*.log {
       daily
       missingok
       rotate 30
       compress
       delaycompress
       notifempty
       sharedscripts
       postrotate
           pm2 reload shibboleth-backend
       endscript
   }
   LOGROTATE

   # Health check monitoring
   cat > health-monitor.sh << HEALTH
   #!/bin/bash
   while true; do
       if ! curl -s https://your-domain.com/api/health | grep -q "ok"; then
           echo "\$(date): Health check failed" >> /var/log/shibboleth-app/health.log
           # Add notification logic here (email, Slack, etc.)
       fi
       sleep 60
   done
   HEALTH
   chmod +x health-monitor.sh

   echo "✓ Monitoring setup complete"
   EOF
   chmod +x setup-monitoring.sh
   ```

#### Step 7: Troubleshooting IdP Integration

**Common Issues and Solutions**:

1. **"Stale Request" Error (University of Jaffna Zoom Login Service)**:

   This error occurs when SAML request/response timing or session issues happen.

   **Immediate Solutions**:

   ```bash
   # 1. Clear browser cache and cookies completely
   # 2. Use incognito/private browsing mode
   # 3. Do NOT use browser back button during authentication
   # 4. Ensure you're not bookmarking the login form
   ```

   **Server-side Fixes** (already implemented):

   ```bash
   # Updated SAML configuration with:
   # - Increased clock skew tolerance (5 minutes)
   # - Disabled InResponseTo validation
   # - Added session management
   # - Fixed callback URLs and timing issues
   ```

   **Debug Information**:

   ```bash
   # Check debug endpoint for current configuration
   curl http://localhost:5001/api/debug/saml
   ```

2. **"Certificate Required" Error**:

   ```bash
   # Ensure IDP_CERT is properly configured in .env
   # Certificate should be base64 encoded, single line, no headers
   ```

3. **SAML Response Validation Errors**:

   ```bash
   # Check IdP logs for specific validation errors
   # Verify time synchronization between SP and IdP
   # Check certificate validity and encoding
   ```

4. **Attribute Release Issues**:

   ```bash
   # Verify attribute filter policy allows required attributes
   # Check attribute resolver configuration
   # Confirm user has required attributes in directory
   ```

5. **Redirect Loop Issues**:
   ```bash
   # Verify callback URLs match exactly
   # Check for trailing slashes in URLs
   # Ensure RelayState parameter handling
   ```

#### Step 8: Monitoring and Maintenance

1. **Log Monitoring**:

   ```bash
   # Monitor IdP logs
   tail -f /opt/shibboleth-idp/logs/idp-process.log

   # Monitor SP logs
   tail -f backend/server.log
   ```

2. **Certificate Renewal**:

   - Monitor IdP certificate expiration
   - Update IDP_CERT when certificates are renewed
   - Test authentication after certificate updates

3. **Regular Testing**:
   - Implement automated tests for authentication flow
   - Monitor authentication success rates
   - Regular manual testing of login/logout process

#### Quick Verification Checklist

Before contacting IdP administrator, verify:

- [ ] Backend server running on port 5001
- [ ] SP metadata accessible: `http://localhost:5001/api/auth/metadata`
- [ ] Health check passes: `http://localhost:5001/api/health`
- [ ] Configuration check: `http://localhost:5001/api/config`
- [ ] All environment variables properly set in `backend/.env`
- [ ] IdP certificate obtained and configured
- [ ] Frontend build successful (if testing full flow)

**Quick Test Commands**:

```bash
# Verify backend is running
curl http://localhost:5001/api/health

# Check configuration status
curl http://localhost:5001/api/config

# Download SP metadata for IdP administrator
curl http://localhost:5001/api/auth/metadata > sp-metadata.xml

# Test login initiation (should redirect to IdP)
curl -I http://localhost:5001/api/auth/login
```

### Key Configuration Files

1. **Backend Environment** (`.env`):

   - JWT secrets and expiration times
   - IdP endpoints and SP configuration
   - Session settings

2. **Frontend Environment** (`.env`):
   - API base URL configuration

## Security Features

- **JWT Tokens**: Short-lived access tokens with refresh tokens
- **HTTP-Only Cookies**: Secure token storage
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API abuse prevention
- **Helmet.js**: Security headers
- **SAML Validation**: Proper SAML response validation

## Directory Structure

```
.
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── protected.js
│   │   ├── services/
│   │   │   ├── samlService.js
│   │   │   └── tokenService.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── Navbar.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
└── README.md
```

## Troubleshooting

### Server Setup Issues

1. **Backend Server Won't Start**:

   ```bash
   # Check if port 5001 is already in use
   lsof -i :5001

   # Kill existing process if needed
   kill -9 <PID>

   # Check Node.js version
   node --version  # Should be v18+

   # Verify all dependencies are installed
   cd backend && npm install

   # Check for missing environment variables
   node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET ? 'JWT_SECRET: OK' : 'JWT_SECRET: MISSING')"
   ```

2. **Frontend Build/Start Issues**:

   ```bash
   # Clear npm cache
   npm cache clean --force

   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install

   # Check for port conflicts
   lsof -i :3000

   # Start on different port if needed
   PORT=3001 npm start
   ```

3. **Environment Variable Problems**:

   ```bash
   # Verify .env file exists and is readable
   ls -la backend/.env

   # Check .env file format (no spaces around =)
   cat backend/.env | grep -E "^[A-Z_]+=.*"

   # Test environment loading
   cd backend && node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT)"
   ```

4. **Permission Errors**:

   ```bash
   # Fix npm permissions (macOS/Linux)
   sudo chown -R $(whoami) ~/.npm

   # Install dependencies with correct permissions
   npm install --no-optional

   # Check file permissions
   ls -la backend/.env
   chmod 600 backend/.env  # Secure .env file
   ```

5. **Network/Firewall Issues**:

   ```bash
   # Test if ports are accessible
   telnet localhost 5001
   telnet localhost 3000

   # Check firewall rules (macOS)
   sudo pfctl -sr | grep -E "(5001|3000)"

   # Test external access
   curl -I http://localhost:5001/api/health
   ```

6. **SSL/Certificate Issues in Development**:

   ```bash
   # Bypass SSL verification for development
   export NODE_TLS_REJECT_UNAUTHORIZED=0

   # Or fix certificate issues
   curl -k https://idp.jfn.ac.lk/idp/shibboleth
   ```

7. **Memory/Resource Issues**:

   ```bash
   # Check available memory
   free -h  # Linux
   vm_stat  # macOS

   # Monitor Node.js memory usage
   node --max-old-space-size=4096 src/server-alt.js

   # Check disk space
   df -h
   ```

8. **Database/Session Store Issues**:

   ```bash
   # Clear session data
   rm -rf sessions/  # If using file-based sessions

   # Reset in-memory sessions (restart server)
   pm2 restart all  # If using PM2
   ```

9. **Logs and Debugging**:

   ```bash
   # Enable debug logging
   DEBUG=* npm run dev

   # Check application logs
   tail -f backend/server.log

   # Check system logs
   tail -f /var/log/syslog  # Linux
   tail -f /var/log/system.log  # macOS
   ```

10. **Quick Health Check Script**:

    ```bash
    #!/bin/bash
    echo "=== System Health Check ==="
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "Backend port 5001: $(lsof -i :5001 | wc -l) processes"
    echo "Frontend port 3000: $(lsof -i :3000 | wc -l) processes"
    echo "Backend .env exists: $(test -f backend/.env && echo 'YES' || echo 'NO')"
    echo "Frontend build exists: $(test -d frontend/build && echo 'YES' || echo 'NO')"
    echo "=== API Health ==="
    curl -s http://localhost:5001/api/health || echo "Backend not responding"
    curl -s -I http://localhost:3000 | head -1 || echo "Frontend not responding"
    ```

### Common Issues

1. **SAML Certificate Errors**:

   - Ensure you have the correct IdP certificate
   - Verify certificate format and encoding

2. **Redirect URI Mismatch**:

   - Check SP_CALLBACK_URL in environment variables
   - Verify IdP configuration matches your callback URLs

3. **Token Refresh Failures**:

   - Check JWT secret configuration
   - Verify cookie settings and domain configuration

4. **CORS Issues**:
   - Ensure FRONTEND_URL is correctly set in backend
   - Check browser console for CORS errors

### Development Tips

1. **Testing Authentication Flow**:

   - Use browser dev tools to inspect cookies
   - Check network tab for API calls
   - Monitor console for authentication errors

2. **Debugging SAML**:
   - Enable SAML response logging in development
   - Check IdP logs for authentication failures
   - Verify metadata XML format

## License

MIT License

## Support

For issues and questions, please check the troubleshooting section or create an issue in the repository.
