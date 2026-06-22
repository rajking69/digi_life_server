require("dotenv").config();
const fs = require("fs");
const { MongoClient, ObjectId } = require("mongodb");

// Recursively parses MongoDB Extended JSON ($oid, $date) into proper native driver Objects
const parseExtendedJson = (obj) => {
    if (Array.isArray(obj)) return obj.map(parseExtendedJson);
    if (obj !== null && typeof obj === "object") {
        if (obj.$oid) return new ObjectId(obj.$oid);
        if (obj.$date) return new Date(obj.$date);
        for (const key in obj) {
            obj[key] = parseExtendedJson(obj[key]);
        }
    }
    return obj;
};

async function importSeed() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    if (!uri || !dbName) {
        console.error("❌ Missing MONGODB_URI or DB_NAME in .env");
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);

        const filesToCollections = [
            { file: "users.json", collection: "users" },
            { file: "lessons.json", collection: "lessons" },
            { file: "favorites.json", collection: "favorites" },
            { file: "comments.json", collection: "comments" },
            { file: "lessonsReports.json", collection: "lessonsReports" }
        ];

        for (const { file, collection } of filesToCollections) {
            // 1. Read the JSON file
            const rawData = fs.readFileSync(file, "utf-8");
            const jsonData = JSON.parse(rawData);

            // 2. Parse Extended JSON format
            const parsedData = parseExtendedJson(jsonData);

            const dbCollection = db.collection(collection);

            // 3. Delete existing documents
            await dbCollection.deleteMany({});

            // 4. Insert new documents
            if (parsedData.length > 0) {
                await dbCollection.insertMany(parsedData);
            }

            console.log(`✅ ${collection} imported`);
        }

        console.log("\n🎉 Seed import completed successfully.");

    } catch (error) {
        console.error("❌ Error importing seed data:", error);
    } finally {
        // 8. Properly close connection
        await client.close();
        process.exit(0);
    }
}

importSeed();
