const { ObjectId } = require("mongodb");
const client = require("../config/mongodb");

const getUsersCollection = () => client.db(process.env.DB_NAME).collection("users");

const createUser = async (userData) => {
    const usersCollection = getUsersCollection();

    // Check duplicate email
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
        const error = new Error("User with this email already exists.");
        error.statusCode = 409;
        throw error;
    }

    const newUser = {
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL || "",
        role: "user", // default
        isPremium: false, // default
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    return { _id: result.insertedId, ...newUser };
};

const getAllUsers = async () => {
    return await getUsersCollection().find({}).toArray();
};

const getUserByEmail = async (email) => {
    return await getUsersCollection().findOne({ email });
};

const updateUser = async (id, updateData) => {
    const usersCollection = getUsersCollection();
    
    const filteredUpdateData = { ...updateData };
    // Prevent updating critical fields via generic update
    delete filteredUpdateData._id;
    delete filteredUpdateData.email; 
    filteredUpdateData.updatedAt = new Date();

    const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: filteredUpdateData },
        { returnDocument: "after" }
    );
    
    return result;
};

const deleteUser = async (id) => {
    const usersCollection = getUsersCollection();
    return await usersCollection.deleteOne({ _id: new ObjectId(id) });
};

const getTopContributors = async () => {
    const lessonsCollection = client.db(process.env.DB_NAME).collection("lessons");
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pipeline = [
        {
            $match: {
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: "$creatorEmail",
                lessonsCreated: { $sum: 1 }
            }
        },
        {
            $sort: { lessonsCreated: -1 }
        },
        {
            $limit: 4
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "email",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $replaceRoot: { newRoot: { $mergeObjects: ["$userDetails", { lessonsCreated: "$lessonsCreated" }] } }
        },
        {
            $project: {
                password: 0 // exclude sensitive fields if any
            }
        }
    ];

    return await lessonsCollection.aggregate(pipeline).toArray();
};

module.exports = {
    createUser,
    getAllUsers,
    getTopContributors,
    getUserByEmail,
    updateUser,
    deleteUser,
};
