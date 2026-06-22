const fs = require('fs');
const crypto = require('crypto');

// Helpers
const generateObjectId = () => crypto.randomBytes(12).toString('hex');
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBoolean = () => Math.random() > 0.5;

// Data setup
const users = [];
const lessons = [];
const favorites = [];
const comments = [];
const lessonsReports = [];

// 1. Generate 10 Users
const userNames = ["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince", "Ethan Hunt", "Fiona Gallagher", "George Costanza", "Hannah Abbott", "Ian Malcolm", "Jane Doe"];
for (let i = 0; i < 10; i++) {
    users.push({
        _id: { "$oid": generateObjectId() },
        name: userNames[i],
        email: `${userNames[i].split(" ")[0].toLowerCase()}@example.com`,
        photoURL: `https://i.pravatar.cc/150?u=${i}`,
        role: i === 0 ? "admin" : "user",
        isPremium: randomBoolean(),
        createdAt: { "$date": new Date(Date.now() - randomInt(10000000000, 20000000000)).toISOString() },
        updatedAt: { "$date": new Date().toISOString() }
    });
}

// 2. Generate 30 Lessons
const categories = ["Technology", "Health", "Business", "Lifestyle", "Education"];
const tones = ["Inspirational", "Informative", "Humorous", "Serious", "Motivational"];
for (let i = 0; i < 30; i++) {
    const creator = randomChoice(users);
    
    // Generate random likes
    const likes = [];
    const likesCount = randomInt(0, 5);
    const likeSet = new Set();
    while (likes.length < likesCount) {
        const liker = randomChoice(users);
        if (!likeSet.has(liker._id.$oid)) {
            likeSet.add(liker._id.$oid);
            likes.push(liker._id);
        }
    }

    lessons.push({
        _id: { "$oid": generateObjectId() },
        title: `Mastering ${randomChoice(["Life", "Code", "Health", "Finances", "Relationships", "Stress", "Productivity", "Mindfulness"])} Part ${i + 1}`,
        description: `An in-depth lesson on improving your life skills and knowledge. This is part ${i + 1} of our series. It covers essential strategies that will help you grow.`,
        category: randomChoice(categories),
        emotionalTone: randomChoice(tones),
        visibility: randomChoice(["public", "private"]),
        accessLevel: randomChoice(["free", "premium"]),
        image: `https://picsum.photos/seed/${i + 100}/800/600`,
        creatorId: creator._id,
        creatorName: creator.name,
        creatorEmail: creator.email,
        creatorPhoto: creator.photoURL,
        likes: likes,
        likesCount: likes.length,
        favoritesCount: 0,
        commentsCount: 0,
        isFeatured: randomBoolean(),
        isReviewed: randomBoolean(),
        createdAt: { "$date": new Date(Date.now() - randomInt(5000000000, 10000000000)).toISOString() },
        updatedAt: { "$date": new Date().toISOString() }
    });
}

// 3. Generate 25 Favorites
const favoriteSet = new Set();
while (favorites.length < 25) {
    const user = randomChoice(users);
    const lesson = randomChoice(lessons);
    const key = `${user._id.$oid}_${lesson._id.$oid}`;
    
    if (!favoriteSet.has(key)) {
        favoriteSet.add(key);
        favorites.push({
            _id: { "$oid": generateObjectId() },
            userId: user._id,
            lessonId: lesson._id,
            savedAt: { "$date": new Date(Date.now() - randomInt(1000000, 5000000000)).toISOString() }
        });
        lesson.favoritesCount++;
    }
}

// 4. Generate 40 Comments
for (let i = 0; i < 40; i++) {
    const user = randomChoice(users);
    const lesson = randomChoice(lessons);
    comments.push({
        _id: { "$oid": generateObjectId() },
        lessonId: lesson._id,
        userId: user._id,
        userName: user.name,
        userPhoto: user.photoURL,
        text: `This is an amazing lesson! Really helped me understand ${lesson.category} better. Highly recommended!`,
        createdAt: { "$date": new Date(Date.now() - randomInt(10000, 1000000000)).toISOString() }
    });
    lesson.commentsCount++;
}

// 5. Generate 10 Reports
const reportSet = new Set();
while (lessonsReports.length < 10) {
    const user = randomChoice(users);
    const lesson = randomChoice(lessons);
    const key = `${user._id.$oid}_${lesson._id.$oid}`;
    
    if (!reportSet.has(key)) {
        reportSet.add(key);
        lessonsReports.push({
            _id: { "$oid": generateObjectId() },
            lessonId: lesson._id,
            reporterUserId: user._id,
            reporterEmail: user.email,
            reason: randomChoice(["Spam", "Inappropriate content", "Plagiarism", "Other"]),
            timestamp: { "$date": new Date(Date.now() - randomInt(10000, 1000000000)).toISOString() }
        });
    }
}

// Save each array to a separate JSON file
fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
fs.writeFileSync('lessons.json', JSON.stringify(lessons, null, 2));
fs.writeFileSync('favorites.json', JSON.stringify(favorites, null, 2));
fs.writeFileSync('comments.json', JSON.stringify(comments, null, 2));
fs.writeFileSync('lessonsReports.json', JSON.stringify(lessonsReports, null, 2));

console.log("Successfully generated separate JSON files.");
