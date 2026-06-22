const { MongoClient, ServerApiVersion } = require("mongodb");

// NOTE: strict: false is required for Better Auth compatibility.
// MongoDB strict mode blocks certain API operations that Better Auth uses
// for OAuth state/verification management (the 'verification' collection).
// With strict: true, state_mismatch errors occur during Google OAuth callbacks
// because the verification document cannot be created or queried.
const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: false,
    },
});

// Eagerly connect to MongoDB (essential for serverless environments)
client.connect()
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

module.exports = client;