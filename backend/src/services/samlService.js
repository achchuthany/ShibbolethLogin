const passport = require("passport");
const SamlStrategy = require("passport-saml").Strategy;
const fs = require("fs");
const crypto = require("crypto");

// Constants for VCR compliance
const VCR_REQUIRED_ATTRIBUTES = [
  "cn",
  "uid",
  "mail",
  "sn",
  "givenName",
  "eduPersonAffiliation",
  "eduPersonEntitlement",
  "eduPersonPrincipalName",
  "eduPersonScopedAffiliation",
  "eduPersonOrgUnitDN",
  "mobile",
];

// OID mappings for SAML attributes
const ATTRIBUTE_OID_MAP = {
  mail: "urn:oid:0.9.2342.19200300.100.1.3",
  email: "urn:oid:0.9.2342.19200300.100.1.3",
  uid: "urn:oid:0.9.2342.19200300.100.1.1",
  sn: "urn:oid:2.5.4.4",
  surname: "urn:oid:2.5.4.4",
  givenName: "urn:oid:2.5.4.42",
  givenname: "urn:oid:2.5.4.42",
  displayName: "urn:oid:2.16.840.1.113730.3.1.241",
  cn: "urn:oid:2.5.4.3",
  principalName: "urn:oid:1.3.6.1.4.1.5923.1.1.1.6",
  eduPersonPrincipalName: "urn:oid:1.3.6.1.4.1.5923.1.1.1.6",
  eduPersonAffiliation: "urn:oid:1.3.6.1.4.1.5923.1.1.1.1",
  eduPersonOrgUnitDN: "urn:oid:1.3.6.1.4.1.5923.1.1.1.4",
  eduPersonScopedAffiliation: "urn:oid:1.3.6.1.4.1.5923.1.1.1.9",
  eduPersonEntitlement: "urn:oid:1.3.6.1.4.1.5923.1.1.1.7",
  mobile: "urn:oid:0.9.2342.19200300.100.1.41",
};

class SamlService {
  static initializePassport() {
    // Check if we have required configuration
    if (!process.env.IDP_SSO_URL) {
      console.error(
        "[SAML ERROR] IDP_SSO_URL not configured. SAML authentication will not work."
      );
      return null;
    }

    // Default certificate for development - replace with real IdP certificate
    const defaultCert =
      "MIICXjCCAcegAwIBAgIBADANBgkqhkiG9w0BAQ0FADBLMQswCQYDVQQGEwJ1czELMAkGA1UECAwCVVMxCzAJBgNVBAcMAkNBMRowGAYDVQQKDBF0ZXN0LmV4YW1wbGUuY29tMQowCAYDVQQDDAExMB4XDTE5MDYxMDE4MDUyOFoXDTIwMDYwOTE4MDUyOFowSzELMAkGA1UEBhMCdXMxCzAJBgNVBAgMAk5VMQswCQYDVQQHDAJOQTEaMBgGA1UECgwRdGVzdC5leGFtcGxlLmNvbTEKMAgGA1UEAwwBMTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAxZCeJg==";

    // IMPORTANT: Keep SAML options minimal. Previous config set attributeConsumingServiceIndex:false which
    // produced AttributeConsumingServiceIndex="false" in AuthnRequest. Shibboleth expects an INTEGER and
    // throws NumberFormatException ("For input string: 'false'") during unmarshalling, leading to UnableToDecode.
    // Also removed non-standard / unsupported fields that don't belong to passport-saml and may introduce
    // unexpected attributes or behavior at the IdP.
    const nameIdFormat =
      process.env.SAML_NAMEID_FORMAT?.trim() ||
      "urn:oasis:names:tc:SAML:2.0:nameid-format:transient"; // switched default to transient
    // Helper loaders (prefer file paths, fallback to env vars)
    const readIfFile = (p) => {
      if (!p) return null;
      try {
        return fs.readFileSync(p, "utf8");
      } catch (_) {
        return null;
      }
    };
    const normalizeCert = (raw) => {
      if (!raw) return null;
      let txt = raw.replace(/\\n/g, "\n").trim();
      // If only header present (bad multi-line env parsing) treat as empty
      if (/^-----BEGIN CERTIFICATE-----$/.test(txt)) return null;
      // If no BEGIN line assume it's just base64 body
      if (!txt.includes("BEGIN CERTIFICATE")) {
        txt = `-----BEGIN CERTIFICATE-----\n${txt.replace(
          /\s+/g,
          ""
        )}\n-----END CERTIFICATE-----`;
      }
      return txt;
    };
    const normalizeKey = (raw) => {
      if (!raw) return null;
      let txt = raw.replace(/\\n/g, "\n").trim();
      if (/^-----BEGIN (?:RSA )?PRIVATE KEY-----$/.test(txt)) return null;
      if (!txt.includes("BEGIN")) {
        txt = `-----BEGIN PRIVATE KEY-----\n${txt.replace(
          /\s+/g,
          ""
        )}\n-----END PRIVATE KEY-----`;
      }
      return txt;
    };

    const spCert = normalizeCert(
      readIfFile(process.env.SP_CERT_FILE) || process.env.SP_CERT || null
    );
    const spKey = normalizeKey(
      readIfFile(process.env.SP_PRIVATE_KEY_FILE) ||
        process.env.SP_PRIVATE_KEY ||
        null
    );

    // Load IdP signing cert(s) (support file + multi-cert separation)
    const loadIdpCerts = () => {
      const fsPath = process.env.IDP_CERT_FILE;
      let raw = null;
      if (fsPath) {
        try {
          raw = fs.readFileSync(fsPath, "utf8");
        } catch (e) {
          if (process.env.SAML_DEBUG === "true") {
            console.warn(
              "[SAML DEBUG] Failed reading IDP_CERT_FILE:",
              e.message
            );
          }
        }
      }
      if (!raw) raw = process.env.IDP_CERT || "";
      if (!raw) return defaultCert; // fallback dev stub
      const parts = raw
        .split(/\|\||\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      const norm = parts.map((p) => {
        let txt = p.replace(/\r/g, "").trim();
        if (txt.includes("BEGIN CERTIFICATE")) return txt;
        txt = txt.replace(/\s+/g, "");
        return (
          "-----BEGIN CERTIFICATE-----\n" +
          txt.match(/.{1,64}/g).join("\n") +
          "\n-----END CERTIFICATE-----"
        );
      });
      return norm.length === 1 ? norm[0] : norm;
    };
    const idpCertLoaded = loadIdpCerts();

    const computeFingerprint = (pem) => {
      try {
        const b64 = pem
          .replace(/-----.*CERTIFICATE-----/g, "")
          .replace(/\s+/g, "");
        const der = Buffer.from(b64, "base64");
        return crypto
          .createHash("sha1")
          .update(der)
          .digest("hex")
          .match(/.{2}/g)
          .join(":")
          .toUpperCase();
      } catch {
        return "ERROR";
      }
    };

    const samlOptions = {
      entryPoint:
        process.env.IDP_SSO_URL ||
        "https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO",
      logoutUrl:
        process.env.IDP_SLO_URL ||
        "https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SLO",
      issuer: process.env.SP_ENTITY_ID || "http://localhost:5001/metadata",
      callbackUrl:
        process.env.SP_CALLBACK_URL ||
        "http://localhost:5001/api/auth/callback",
      logoutCallbackUrl:
        process.env.SP_LOGOUT_CALLBACK_URL ||
        "http://localhost:5001/api/auth/logout/callback",
      cert: idpCertLoaded,
      identifierFormat: nameIdFormat,
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",
      authnRequestBinding: "HTTP-Redirect",
      forceAuthn: false,
      disableRequestedAuthnContext: true,
      validateInResponseTo: false,
      // We use a (profile, done) verify signature, so ensure passReqToCallback is false
      passReqToCallback: false,
      wantAssertionsSigned: process.env.SAML_WANT_ASSERTIONS_SIGNED === "true",
      wantAuthnResponseSigned: process.env.SAML_WANT_RESPONSE_SIGNED === "true",
      acceptedClockSkewMs: 300000, // 5 minutes
    };
    if (process.env.REQUESTED_ATTRIBUTES) {
      samlOptions.attributeConsumingServiceIndex = 1;
    }
    // VCR_MODE is always enabled - set the canonical VCR attribute list
    if (!process.env.REQUESTED_ATTRIBUTES) {
      process.env.REQUESTED_ATTRIBUTES = VCR_REQUIRED_ATTRIBUTES.join(",");
      samlOptions.attributeConsumingServiceIndex = 1;
      if (process.env.SAML_DEBUG === "true") {
        console.log(
          "[SAML DEBUG] VCR_MODE always active: requesting",
          VCR_REQUIRED_ATTRIBUTES.length,
          "attributes"
        );
      }
    }

    if (spKey) {
      samlOptions.decryptionPvk = spKey;
      if (process.env.SAML_SIGN_REQUESTS === "true") {
        samlOptions.privateKey = spKey;
      }
    } else if (process.env.SAML_DEBUG === "true") {
      console.warn(
        "[SAML DEBUG] No SP private key loaded - SAML decryption and signing disabled"
      );
    }
    if (!spCert && process.env.SAML_DEBUG === "true") {
      console.warn(
        "[SAML DEBUG] No SP certificate loaded - metadata KeyDescriptor will be empty"
      );
    }

    if (process.env.SAML_DEBUG === "true") {
      console.log(
        "[SAML DEBUG] initializePassport spCert length:",
        spCert && spCert.length,
        "spKey length:",
        spKey && spKey.length
      );
      if (Array.isArray(idpCertLoaded)) {
        console.log("[SAML DEBUG] IdP certs count:", idpCertLoaded.length);
        idpCertLoaded.forEach((c, i) =>
          console.log(
            `  [IdP Cert ${i}] len=${c.length} fp=${computeFingerprint(c)}`
          )
        );
      } else {
        console.log(
          "[SAML DEBUG] IdP cert len:",
          idpCertLoaded && idpCertLoaded.length,
          "fp=",
          computeFingerprint(idpCertLoaded)
        );
      }
    }

    passport.use(
      "saml",
      new SamlStrategy(samlOptions, async (profile, done) => {
        if (process.env.SAML_DEBUG === "true") {
          console.log(
            "[SAML DEBUG] Received SAML response with",
            Object.keys(profile).length,
            "attributes"
          );
        }
        try {
          // Process the SAML response with LEARN-LK specific attributes
          const user = {
            // Core identity
            id: profile.nameID || profile.nameIdentifier,
            uid: profile.uid || profile["urn:oid:0.9.2342.19200300.100.1.1"], // uid

            // Personal information
            email:
              profile.email ||
              profile.mail ||
              profile["urn:oid:0.9.2342.19200300.100.1.3"],
            firstName:
              profile.firstName ||
              profile.givenName ||
              profile.givenname ||
              profile["urn:oid:2.5.4.42"],
            lastName:
              profile.lastName ||
              profile.surname ||
              profile.sn ||
              profile["urn:oid:2.5.4.4"],
            displayName:
              profile.displayName ||
              profile.cn ||
              profile["urn:oid:2.16.840.1.113730.3.1.241"] || // displayName
              profile["urn:oid:2.5.4.3"],
            cn: profile.cn || profile["urn:oid:2.5.4.3"],

            // LEARN-LK specific attributes for Zoom and other services
            principalName:
              profile.principalName ||
              profile.eduPersonPrincipalName ||
              profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.6"], // eduPersonPrincipalName
            affiliation:
              profile.eduPersonAffiliation ||
              profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.1"], // eduPersonAffiliation
            orgUnitDN:
              profile.eduPersonOrgUnitDN ||
              profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.4"], // eduPersonOrgUnitDN
            mobile:
              profile.mobile ||
              profile.telephoneNumber ||
              profile["urn:oid:0.9.2342.19200300.100.1.41"],

            // VCR attributes
            scopedAffiliation:
              profile.eduPersonScopedAffiliation ||
              profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.9"], // eduPersonScopedAffiliation
            entitlement:
              profile.eduPersonEntitlement ||
              profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.7"], // eduPersonEntitlement

            // Organizational information
            department:
              profile.department || profile.ou || profile["urn:oid:2.5.4.11"],
            organization:
              profile.organization || profile.o || profile["urn:oid:2.5.4.10"],
            homeOrganization: profile.schacHomeOrganization,
            homeOrganizationType: profile.schacHomeOrganizationType,

            // Additional eduPerson attributes
            scopedAffiliation:
              profile.eduPersonScopedAffiliation ||
              profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.9"], // eduPersonScopedAffiliation
            entitlement:
              profile.eduPersonEntitlement ||
              profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.7"], // eduPersonEntitlement

            // Store all attributes for debugging and extensibility
            attributes: profile,
          };

          // Post-normalization fallback helper
          const ensure = (obj, field, candidates) => {
            if (obj[field]) return;
            for (const c of candidates) {
              const val = c && typeof c === "string" ? c.trim() : c;
              if (val) {
                obj[field] = val;
                break;
              }
            }
            if (!obj[field] && process.env.SAML_DEBUG === "true") {
              console.warn(
                `[SAML DEBUG] Missing attribute '${field}' after mapping (candidates tried: ${
                  candidates.filter(Boolean).length
                })`
              );
            }
          };

          ensure(user, "email", [
            user.email,
            profile.mail,
            profile.email,
            profile["urn:oid:0.9.2342.19200300.100.1.3"],
          ]);
          ensure(user, "firstName", [
            user.firstName,
            profile.givenName,
            profile.givenname,
            profile["urn:oid:2.5.4.42"],
          ]);
          ensure(user, "lastName", [
            user.lastName,
            profile.sn,
            profile.surname,
            profile["urn:oid:2.5.4.4"],
          ]);
          ensure(user, "displayName", [
            user.displayName,
            profile.displayName,
            profile.cn,
            profile["urn:oid:2.16.840.1.113730.3.1.241"],
            profile["urn:oid:2.5.4.3"],
          ]);
          ensure(user, "principalName", [
            user.principalName,
            profile.eduPersonPrincipalName,
            profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.6"],
          ]);
          ensure(user, "affiliation", [
            user.affiliation,
            profile.eduPersonAffiliation,
            profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.1"],
          ]);
          ensure(user, "orgUnitDN", [
            user.orgUnitDN,
            profile.eduPersonOrgUnitDN,
            profile["urn:oid:1.3.6.1.4.1.5923.1.1.1.4"],
          ]);
          ensure(user, "mobile", [
            user.mobile,
            profile.mobile,
            profile.telephoneNumber,
            profile["urn:oid:0.9.2342.19200300.100.1.41"],
          ]);

          // VCR required attributes enforcement (always enabled)
          const required = process.env.VCR_REQUIRED_ATTRIBUTES
            ? process.env.VCR_REQUIRED_ATTRIBUTES.split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : VCR_REQUIRED_ATTRIBUTES;
          const missing = [];
          const attributePresence = {};
          required.forEach((attr) => {
            // Map logical names to user object keys
            let key = attr;
            if (attr === "mail" || attr === "email") key = "email";
            if (attr === "givenName" || attr === "givenname") key = "firstName";
            if (attr === "sn") key = "lastName";
            if (attr === "eduPersonPrincipalName") key = "principalName";
            if (attr === "eduPersonScopedAffiliation")
              key = "scopedAffiliation";
            if (attr === "eduPersonAffiliation") key = "affiliation";
            if (attr === "eduPersonEntitlement") key = "entitlement";
            if (attr === "eduPersonOrgUnitDN") key = "orgUnitDN";
            if (!user[key]) missing.push(attr);
            attributePresence[attr] = !!user[key];
          });
          user.vcrAttributePresence = attributePresence;
          user.vcrMissing = missing;
          user.vcrCompliant = missing.length === 0;
          if (process.env.SAML_DEBUG === "true") {
            if (missing.length) {
              console.warn(
                "[SAML DEBUG] VCR required attributes missing:",
                missing
              );
            } else {
              console.log("[SAML DEBUG] All VCR required attributes present");
            }
          }
          if (process.env.SAML_ENFORCE_REQUIRED === "true" && missing.length) {
            return done(
              new Error(
                "Missing required VCR attributes: " + missing.join(", ")
              ),
              null
            );
          }

          if (process.env.SAML_DEBUG === "true") {
            console.log("[SAML DEBUG] Profile processed successfully:", {
              nameID: user.id?.substring(0, 20) + "...",
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              affiliation: user.affiliation,
              mobile: user.mobile,
              vcrCompliant: user.vcrCompliant,
              totalAttributes: Object.keys(profile).length,
            });
          } else {
            console.log("[SAML] User authenticated successfully:", {
              uid: user.uid,
              email: user.email,
              vcrCompliant: user.vcrCompliant,
            });
          }

          return done(null, user);
        } catch (error) {
          console.error(
            "[SAML ERROR] Failed to process SAML profile:",
            error.message
          );
          if (process.env.SAML_DEBUG === "true") {
            console.error("[SAML DEBUG] Full error stack:", error);
          }
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
    const defaultCert =
      "MIICXjCCAcegAwIBAgIBADANBgkqhkiG9w0BAQ0FADBLMQswCQYDVQQGEwJ1czELMAkGA1UECAwCVVMxCzAJBgNVBAcMAkNBMRowGAYDVQQKDBF0ZXN0LmV4YW1wbGUuY29tMQowCAYDVQQDDAExMB4XDTE5MDYxMDE4MDUyOFoXDTIwMDYwOTE4MDUyOFowSzELMAkGA1UEBhMCdXMxCzAJBgNVBAgMAk5VMQswCQYDVQQHDAJOQTEaMBgGA1UECgwRdGVzdC5leGFtcGxlLmNvbTEKMAgGA1UEAwwBMTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAxZCeJg==";
    const trim = (v) => (v ? v.trim() : v);
    const entityId =
      trim(process.env.SP_ENTITY_ID) || "http://localhost:5001/metadata";
    const acs =
      trim(process.env.SP_CALLBACK_URL) ||
      "http://localhost:5001/api/auth/callback";
    const slo =
      trim(process.env.SP_LOGOUT_CALLBACK_URL) ||
      "http://localhost:5001/api/auth/logout/callback";

    const nameIdFormatMeta =
      process.env.SAML_NAMEID_FORMAT?.trim() ||
      "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";
    const readIfFile = (p) => {
      if (!p) return null;
      try {
        return fs.readFileSync(p, "utf8");
      } catch {
        return null;
      }
    };
    const normalizeCert = (raw) => {
      if (!raw) return null;
      let txt = raw.replace(/\\n/g, "\n").trim();
      if (/^-----BEGIN CERTIFICATE-----$/.test(txt)) return null;
      if (!txt.includes("BEGIN CERTIFICATE")) {
        txt = `-----BEGIN CERTIFICATE-----\n${txt.replace(
          /\s+/g,
          ""
        )}\n-----END CERTIFICATE-----`;
      }
      return txt;
    };
    const normalizeKey = (raw) => {
      if (!raw) return null;
      let txt = raw.replace(/\\n/g, "\n").trim();
      if (/^-----BEGIN (?:RSA )?PRIVATE KEY-----$/.test(txt)) return null;
      if (!txt.includes("BEGIN")) {
        txt = `-----BEGIN PRIVATE KEY-----\n${txt.replace(
          /\s+/g,
          ""
        )}\n-----END PRIVATE KEY-----`;
      }
      return txt;
    };
    const spCert = normalizeCert(
      readIfFile(process.env.SP_CERT_FILE) || process.env.SP_CERT || null
    );
    const spKey = normalizeKey(
      readIfFile(process.env.SP_PRIVATE_KEY_FILE) ||
        process.env.SP_PRIVATE_KEY ||
        null
    );
    // Reuse IdP cert loading for fingerprint diagnostics
    const loadIdpCerts = () => {
      const fsPath = process.env.IDP_CERT_FILE;
      let raw = null;
      if (fsPath) {
        try {
          raw = fs.readFileSync(fsPath, "utf8");
        } catch (e) {
          if (process.env.SAML_DEBUG === "true") {
            console.warn(
              "[SAML DEBUG] Failed reading IDP_CERT_FILE (metadata):",
              e.message
            );
          }
        }
      }
      if (!raw) raw = process.env.IDP_CERT || "";
      if (!raw) return defaultCert;
      const parts = raw
        .split(/\|\||\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      const norm = parts.map((p) => {
        let txt = p.replace(/\r/g, "").trim();
        if (txt.includes("BEGIN CERTIFICATE")) return txt;
        txt = txt.replace(/\s+/g, "");
        return (
          "-----BEGIN CERTIFICATE-----\n" +
          txt.match(/.{1,64}/g).join("\n") +
          "\n-----END CERTIFICATE-----"
        );
      });
      return norm.length === 1 ? norm[0] : norm;
    };
    const idpCertLoaded = loadIdpCerts();
    const computeFingerprint = (pem) => {
      try {
        const b64 = pem
          .replace(/-----.*CERTIFICATE-----/g, "")
          .replace(/\s+/g, "");
        const der = Buffer.from(b64, "base64");
        return crypto
          .createHash("sha1")
          .update(der)
          .digest("hex")
          .match(/.{2}/g)
          .join(":")
          .toUpperCase();
      } catch {
        return "ERROR";
      }
    };
    if (process.env.SAML_DEBUG === "true") {
      console.log(
        "[SAML DEBUG] getMetadata spCert length:",
        spCert && spCert.length,
        "spKey length:",
        spKey && spKey.length
      );
      if (Array.isArray(idpCertLoaded)) {
        console.log(
          "[SAML DEBUG] IdP certs (metadata) count:",
          idpCertLoaded.length
        );
        idpCertLoaded.forEach((c, i) =>
          console.log(`  [IdP Cert ${i} metadata] fp=${computeFingerprint(c)}`)
        );
      } else {
        console.log(
          "[SAML DEBUG] IdP cert (metadata) fp:",
          computeFingerprint(idpCertLoaded)
        );
      }
    }
    const samlOptions = {
      entryPoint:
        trim(process.env.IDP_SSO_URL) ||
        "https://idp.jfn.ac.lk/idp/profile/SAML2/Redirect/SSO",
      issuer: entityId,
      callbackUrl: acs,
      logoutCallbackUrl: slo,
      cert: idpCertLoaded,
      identifierFormat: nameIdFormatMeta,
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",
      disableRequestedAuthnContext: true,
      validateInResponseTo: false,
      wantAssertionsSigned: process.env.SAML_WANT_ASSERTIONS_SIGNED === "true",
      wantAuthnResponseSigned: process.env.SAML_WANT_RESPONSE_SIGNED === "true",
      passReqToCallback: false,
    };

    if (spKey) {
      samlOptions.decryptionPvk = spKey;
      if (process.env.SAML_SIGN_REQUESTS === "true") {
        samlOptions.privateKey = spKey;
      }
    }

    // Log metadata configuration for debugging
    if (process.env.SAML_DEBUG === "true") {
      console.log(
        "[SAML DEBUG] Metadata generation - EntityID:",
        samlOptions.issuer
      );
      console.log(
        "[SAML DEBUG] Metadata generation - ACS URL:",
        samlOptions.callbackUrl
      );
    }

    const strategy = new SamlStrategy(samlOptions, () => {});
    // Include KeyDescriptor(s) if SP cert is provided so IdP can encrypt
    let metadata;
    if (spCert) {
      metadata = strategy.generateServiceProviderMetadata(spCert, spCert);
    } else {
      metadata = strategy.generateServiceProviderMetadata();
      if (process.env.SAML_DEBUG === "true") {
        console.warn(
          "[SAML DEBUG] SP_CERT absent - metadata will have empty KeyDescriptor, IdP encryption may fail"
        );
      }
    }

    // VCR_MODE always active - apply if no explicit REQUESTED_ATTRIBUTES
    if (!process.env.REQUESTED_ATTRIBUTES) {
      process.env.REQUESTED_ATTRIBUTES = VCR_REQUIRED_ATTRIBUTES.join(",");
      if (process.env.SAML_DEBUG === "true") {
        console.log(
          "[SAML DEBUG] Metadata generation: VCR_MODE active, requesting",
          VCR_REQUIRED_ATTRIBUTES.length,
          "attributes"
        );
      }
    }

    // Inject Requested Attributes (AttributeConsumingService) if configured
    const requestedAttrEnv = process.env.REQUESTED_ATTRIBUTES; // comma list
    if (requestedAttrEnv) {
      const rawList = requestedAttrEnv
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      if (rawList.length) {
        // Use predefined OID mappings for consistency
        const basicRequested = new Set();
        const oidRequested = new Set();
        rawList.forEach((n) => {
          basicRequested.add(n);
          const oid = ATTRIBUTE_OID_MAP[n];
          if (oid) oidRequested.add(oid);
          // If an alias maps to eduPersonPrincipalName ensure canonical short name too
          if (n === "principalName")
            basicRequested.add("eduPersonPrincipalName");
        });
        // Avoid duplicate OID entries if user already listed them.
        rawList.forEach((n) => {
          if (n.startsWith("urn:oid:")) oidRequested.delete(n); // already explicit
        });
        const serviceXmlParts = [
          '<AttributeConsumingService index="1">',
          '<ServiceName xml:lang="en">Default</ServiceName>',
        ];
        basicRequested.forEach((name) => {
          serviceXmlParts.push(
            `<RequestedAttribute Name="${name}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic" isRequired="false"/>`
          );
        });
        oidRequested.forEach((oid) => {
          serviceXmlParts.push(
            `<RequestedAttribute Name="${oid}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri" isRequired="false"/>`
          );
        });
        serviceXmlParts.push("</AttributeConsumingService>");
        const serviceBlock = serviceXmlParts.join("");
        metadata = metadata.replace(
          /(<\/SPSSODescriptor>)/,
          serviceBlock + "$1"
        );
        samlOptions.attributeConsumingServiceIndex = 1;
        if (process.env.SAML_DEBUG === "true") {
          console.log("[SAML DEBUG] RequestedAttributes (basic):", [
            ...basicRequested,
          ]);
          console.log("[SAML DEBUG] RequestedAttributes (oid):", [
            ...oidRequested,
          ]);
        }
      }
    }
    return metadata;
  }
}

module.exports = SamlService;
