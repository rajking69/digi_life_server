require("dotenv").config();

const app = require("./src/app");
const client = require("./src/config/mongodb");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await client.connect();
        await client.db(process.env.DB_NAME).command({ ping: 1 });
        console.log("✅ MongoDB Connected");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Server failed to start:", error);
    }
}

startServer();