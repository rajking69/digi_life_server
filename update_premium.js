const { MongoClient } = require('mongodb');
require('dotenv').config({path: 'D:/Web Development (PH)/digi_life_server/.env'});

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const res = await db.collection('users').updateOne({email: 'smrajking4833@gmail.com'}, {$set: {isPremium: true}});
    console.log('Updated:', res.modifiedCount);
    process.exit(0);
}
run();
