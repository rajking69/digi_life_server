const client = require("./mongodb");

let authInstance = null;

const getAuth = async () => {
    if (!authInstance) {
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
            cookie: {
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
    }
    return authInstance;
};

module.exports = { getAuth };
