import { betterAuth } from "better-auth";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL as string,
  }),
  
  // CRITICAL: Set baseURL
  baseURL: process.env.BETTER_AUTH_URL, // e.g., "https://backend.glorious.com.np"
  
  trustedOrigins: [
    process.env.FRONTEND_URL, // "https://dashboard.glorious.com.np"
    process.env.BETTER_AUTH_URL, // "https://backend.glorious.com.np"
    "https://www.glorious.com.np",
    "https://dashboard.glorious.com.np",
    "https://glorious.com.np",
  ],
  
  // Configure cross-subdomain cookies (CORRECT API)
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.DOMAIN_ENDPOINT, // Root domain WITHOUT leading dot
    },
    // Force secure cookies in production
    useSecureCookies: true,
    // Set proper cookie attributes for OAuth
    defaultCookieAttributes: {
      sameSite: "lax", // Keep as 'lax' for same-site subdomains
      secure: true,
      httpOnly: true,
    },
  },
  
  socialProviders: {
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  },
  
  emailAndPassword: {    
    enabled: true,
  },
});