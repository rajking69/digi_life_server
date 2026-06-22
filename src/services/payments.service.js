const { ObjectId } = require("mongodb");
const client = require("../config/mongodb");
const { getPaginationOptions, formatPaginatedResponse } = require("../utils/pagination");

const getPaymentsCollection = () => client.db(process.env.DB_NAME).collection("payments");
const getUsersCollection = () => client.db(process.env.DB_NAME).collection("users");

/**
 * Record a new payment from Stripe webhook payload
 * Upsert prevents duplicates using stripeSessionId
 */
const recordPayment = async (session) => {
    try {
        const userId = session.metadata?.userId;
        const stripeSessionId = session.id;
        const stripePaymentIntentId = session.payment_intent;
        const amount = session.amount_total ? session.amount_total / 100 : 1500; // default if not provided (Stripe amount is in cents)
        const currency = session.currency ? session.currency.toUpperCase() : "BDT";
        
        // Fetch user to ensure we have their current details
        let userDetails = { name: "Unknown", email: "Unknown" };
        if (userId && ObjectId.isValid(userId)) {
            const user = await getUsersCollection().findOne({ _id: new ObjectId(userId) });
            if (user) {
                userDetails = { name: user.name, email: user.email };
            }
        }

        // Extract customer email if provided directly by stripe
        const userEmail = session.customer_details?.email || userDetails.email;
        const userName = session.customer_details?.name || userDetails.name;

        const paymentRecord = {
            userId: userId,
            userName: userName,
            userEmail: userEmail,
            stripeSessionId: stripeSessionId,
            stripePaymentIntentId: stripePaymentIntentId,
            amount: amount,
            currency: currency,
            status: session.payment_status === "paid" ? "paid" : "pending",
            paymentMethod: "card", // Since we only use card
            membershipType: "Lifetime Premium",
            createdAt: new Date()
        };

        const paymentsCollection = getPaymentsCollection();
        
        // Upsert by stripeSessionId to ensure idempotency (no duplicates on webhook retries)
        await paymentsCollection.updateOne(
            { stripeSessionId: stripeSessionId },
            { $setOnInsert: paymentRecord },
            { upsert: true }
        );

        return true;
    } catch (error) {
        console.error("Error recording payment:", error);
        throw error;
    }
};

/**
 * Get paginated payments for a specific user
 */
const getUserPayments = async (userId, query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const paymentsCollection = getPaymentsCollection();

    const filter = { userId: userId.toString() };
    const sortOption = { createdAt: -1 }; // Always newest first

    const totalCount = await paymentsCollection.countDocuments(filter);
    const payments = await paymentsCollection
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();

    return formatPaginatedResponse(payments, totalCount, page, limit);
};

/**
 * Get all paginated payments for admin dashboard
 */
const getAllPayments = async (query = {}) => {
    const { page, limit, skip } = getPaginationOptions(query);
    const { search } = query;
    const paymentsCollection = getPaymentsCollection();

    const filter = {};
    if (search) {
        filter.userEmail = { $regex: search, $options: "i" };
    }

    const sortOption = { createdAt: -1 };

    const totalCount = await paymentsCollection.countDocuments(filter);
    const payments = await paymentsCollection
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();

    return formatPaginatedResponse(payments, totalCount, page, limit);
};

module.exports = {
    recordPayment,
    getUserPayments,
    getAllPayments
};
