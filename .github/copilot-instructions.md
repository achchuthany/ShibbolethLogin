# Shibboleth Authentication Application - Copilot Instructions

This is a complete Node.js Express API with React frontend that integrates with Shibboleth IdP for secure authentication.

## Project Status: ✅ COMPLETE

- ✅ Backend API with Express.js, SAML authentication, JWT tokens
- ✅ React frontend with authentication context and protected routes
- ✅ Security middleware (CORS, Helmet, Rate limiting)
- ✅ Session management with HTTP-only cookies
- ✅ Comprehensive documentation and setup instructions

## Current Setup

- **Backend**: Running on port 5001 (http://localhost:5001)
- **Frontend**: React app with development server capability
- **Authentication**: Shibboleth SAML 2.0 with JWT tokens
- **Security**: HTTP-only cookies, CORS protection, rate limiting

## Next Steps for User

1. **Configure SAML Certificate**: Update `IDP_CERT` in `backend/.env` with your actual IdP certificate
2. **Start Frontend**: Run `cd frontend && npm install && npm start`
3. **Test Authentication**: Access the application and test SAML login flow
4. **Customize**: Extend the application with your specific business logic

## Key Files

- `backend/src/server-alt.js` - Main server with better error handling
- `frontend/src/App.js` - React application with routing
- `backend/src/services/samlService.js` - SAML configuration
- `README.md` - Complete setup and usage documentation
