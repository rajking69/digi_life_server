const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const usersService = require("../services/users.service");
const paymentsService = require("../services/payments.service");
const { ObjectId } = require("mongodb");

const createCheckoutSession = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Digi Life Premium",
                            description: "Unlock all premium lessons and features.",
                        },
                        unit_amount: 999, // $9.99
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.CLIENT_ORIGIN}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_ORIGIN}/premium?canceled=true`,
            metadata: {
                userId: userId,
            },
        });

        res.status(200).json({ success: true, url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata.userId;

        try {
            if (ObjectId.isValid(userId)) {
                await usersService.updateUser(userId, { isPremium: true });
            }
            await paymentsService.recordPayment(session);
        } catch (error) {
            console.error("Error updating user premium status:", error);
        }
    }

    res.status(200).json({ received: true });
};

const verifySession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Session ID is required" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const userId = session.metadata.userId;
            
            // Only update if userId is valid and user isn't already premium to save DB calls
            if (ObjectId.isValid(userId)) {
                await usersService.updateUser(userId, { isPremium: true });
                await paymentsService.recordPayment(session);
                return res.status(200).json({ success: true, isPremium: true });
            }
        }
        
        res.status(200).json({ success: true, isPremium: false });
    } catch (error) {
        console.error("Error verifying session:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

module.exports = {
    createCheckoutSession,
    webhook,
    verifySession,
};
