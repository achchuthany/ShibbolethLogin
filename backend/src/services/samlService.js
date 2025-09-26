const passport = require("passport");
const SamlStrategy = require("passport-saml").Strategy;

class SamlService {
  static initializePassport() {
    // Check if we have required configuration
    if (!process.env.IDP_SSO_URL) {
      console.warn(
        "Warning: IDP_SSO_URL not configured. SAML authentication will not work properly."
      );
    }

    // Default certificate for development - replace with real IdP certificate
    const defaultCert =
      "MIICXjCCAcegAwIBAgIBADANBgkqhkiG9w0BAQ0FADBLMQswCQYDVQQGEwJ1czELMAkGA1UECAwCVVMxCzAJBgNVBAcMAkNBMRowGAYDVQQKDBF0ZXN0LmV4YW1wbGUuY29tMQowCAYDVQQDDAExMB4XDTE5MDYxMDE4MDUyOFoXDTIwMDYwOTE4MDUyOFowSzELMAkGA1UEBhMCdXMxCzAJBgNVBAgMAk5VMQswCQYDVQQHDAJOQTEaMBgGA1UECgwRdGVzdC5leGFtcGxlLmNvbTEKMAgGA1UEAwwBMTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAxZCeJg==";

    const samlOptions = {
      // Identity Provider settings
      entryPoint:
        process.env.IDP_SSO_URL ||
        "https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO",
      logoutUrl:
        process.env.IDP_SLO_URL ||
        "https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SLO",

      // Service Provider settings
      issuer: process.env.SP_ENTITY_ID || "http://localhost:5001/metadata",
      callbackUrl:
        process.env.SP_CALLBACK_URL ||
        "http://localhost:5001/api/auth/callback",
      logoutCallbackUrl:
        process.env.SP_LOGOUT_CALLBACK_URL ||
        "http://localhost:5001/api/auth/logout/callback",

      // Certificate settings - use provided cert or default for development
      cert: process.env.IDP_CERT || defaultCert,

      // SAML settings to prevent stale request errors
      identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",

      // Settings to fix stale request issues
      acceptedClockSkewMs: 300000, // 5 minutes clock skew tolerance
      attributeConsumingServiceIndex: false,
      disableRequestedAuthnContext: true,
      validateInResponseTo: false, // Disable InResponseTo validation to prevent stale request
      requestIdExpirationPeriodMs: 3600000, // 1 hour expiration
      race: false,

      // Additional settings for better compatibility
      skipRequestCompression: true,
      authnRequestBinding: "HTTP-Redirect",
      passReqToCallback: true,

      // Force authentication to prevent cached sessions
      forceAuthn: false,
      isPassive: false,
    };

    passport.use(
      "saml",
      new SamlStrategy(samlOptions, async (profile, done) => {
        try {
          // Process the SAML response
          const user = {
            id: profile.nameID || profile.nameIdentifier,
            email:
              profile.email || profile["urn:oid:0.9.2342.19200300.100.1.3"],
            firstName:
              profile.firstName ||
              profile.givenName ||
              profile["urn:oid:2.5.4.42"],
            lastName:
              profile.lastName || profile.surname || profile["urn:oid:2.5.4.4"],
            displayName:
              profile.displayName || profile.cn || profile["urn:oid:2.5.4.3"],
            department: profile.department || profile["urn:oid:2.5.4.11"],
            organization:
              profile.organization || profile.o || profile["urn:oid:2.5.4.10"],
            attributes: profile,
          };

          console.log("SAML Profile received:", profile);
          return done(null, user);
        } catch (error) {
          console.error("Error processing SAML profile:", error);
          return done(error, null);
        }
      })
    );

    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser((user, done) => {
      done(null, user);
    });

    return passport;
  }

  static getMetadata() {
    // Default certificate for development - replace with real IdP certificate
    const defaultCert =
      "MIICXjCCAcegAwIBAgIBADANBgkqhkiG9w0BAQ0FADBLMQswCQYDVQQGEwJ1czELMAkGA1UECAwCVVMxCzAJBgNVBAcMAkNBMRowGAYDVQQKDBF0ZXN0LmV4YW1wbGUuY29tMQowCAYDVQQDDAExMB4XDTE5MDYxMDE4MDUyOFoXDTIwMDYwOTE4MDUyOFowSzELMAkGA1UEBhMCdXMxCzAJBgNVBAgMAk5VMQswCQYDVQQHDAJOQTEaMBgGA1UECgwRdGVzdC5leGFtcGxlLmNvbTEKMAgGA1UEAwwBMTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAxZCeJg==";

    const samlOptions = {
      entryPoint:
        process.env.IDP_SSO_URL ||
        "https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO",
      issuer: process.env.SP_ENTITY_ID || "http://localhost:5001/metadata",
      callbackUrl:
        process.env.SP_CALLBACK_URL ||
        "http://localhost:5001/api/auth/callback",
      logoutCallbackUrl:
        process.env.SP_LOGOUT_CALLBACK_URL ||
        "http://localhost:5001/api/auth/logout/callback",

      // Certificate settings - use provided cert or default for development
      cert: process.env.IDP_CERT || defaultCert,

      // Additional metadata generation settings
      identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",
      acceptedClockSkewMs: -1,
      attributeConsumingServiceIndex: false,
      disableRequestedAuthnContext: true,
      validateInResponseTo: false,
      requestIdExpirationPeriodMs: 28800000, // 8 hours
      race: false,
    };

    const strategy = new SamlStrategy(samlOptions, () => {});
    return strategy.generateServiceProviderMetadata();
  }
}

module.exports = SamlService;
