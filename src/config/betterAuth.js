const client = require("./mongodb");

let authInstance = null;

// Detect if running in production (HTTPS) environment
const isProduction = (process.env.BETTER_AUTH_URL || "").startsWith("https");

const getAuth = async () => {
    if (!authInstance) {
        try {
            await client.connect();
            const { betterAuth } = await import("better-auth");
            const { mongodbAdapter } = await import("better-auth/adapters/mongodb");
            
            authInstance = betterAuth({
                database: mongodbAdapter(client.db(process.env.DB_NAME)),
                emailAndPassword: {
                    enabled: true,
                },
                trustedOrigins: [
                    process.env.CLIENT_ORIGIN,
                    "http://localhost:3000",
                    "https://digi-life-client.vercel.app"
                ].filter(Boolean),
                socialProviders: {
                    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
                        google: {
                            clientId: process.env.GOOGLE_CLIENT_ID,
                            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                            callbackURL: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`
                        }
                    } : {})
                },
                advanced: {
                    // useSecureCookies forces SameSite=None + Secure on all session cookies.
                    // This is REQUIRED for cross-origin requests between:
                    //   digi-life-client.vercel.app (frontend) and
                    //   digi-life-server.vercel.app (backend)
                    // Without this, Better Auth uses SameSite=Lax by default,
                    // which blocks cross-origin cookies and breaks the session.
                    useSecureCookies: isProduction,
                    // Explicitly set cookie attributes as a belt-and-suspenders approach
                    defaultCookieAttributes: isProduction ? {
                        secure: true,
                        httpOnly: true,
                        sameSite: "none",
                        path: "/",
                    } : {
                        secure: false,
                        httpOnly: true,
                        sameSite: "lax",
                        path: "/",
                    },
                },
                databaseHooks: {
                    user: {
                        create: {
                            after: async (user) => {
                                try {
                                    const usersCollection = client.db(process.env.DB_NAME).collection("users");
                                    const existingUser = await usersCollection.findOne({ email: user.email });
                                    
                                    if (!existingUser) {
                                        await usersCollection.insertOne({
                                            betterAuthId: user.id, // Keep reference to Better Auth's internal user ID
                                            name: user.name,
                                            email: user.email,
                                            photoURL: user.image || "",
                                            role: "user",
                                            isPremium: false,
                                            createdAt: new Date(),
                                            updatedAt: new Date()
                                        });
                                    }
                                } catch (error) {
                                    console.error("Error syncing user to existing collection:", error);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Failed to initialize Better Auth:", error);
            throw error;
        }
    }
    return authInstance;
};

module.exports = { getAuth };
