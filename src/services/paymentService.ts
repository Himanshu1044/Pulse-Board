import pool from "../config/database";
import razorpay from "../config/razorpay";
import {
    subscriptionPlans,
    SubscriptionPlan
} from "../config/subscriptionPlans";

export const createPaymentTransaction = async (
    userId: string,
    subscriptionId: string | null,
    provider: string,
    providerOrderId: string,
    amount: number,
    currency: string,
    plan: string
) => {
    const result = await pool.query(
        `INSERT INTO payment_transactions (
            user_id,
            subscription_id,
            provider,
            provider_order_id,
            amount,
            currency,
            status,
            plan
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
        RETURNING
            id,
            user_id,
            subscription_id,
            provider,
            provider_order_id,
            amount,
            currency,
            status,
            plan,
            created_at,
            updated_at`,
        [
            userId,
            subscriptionId,
            provider,
            providerOrderId,
            amount,
            currency,
            plan
        ]
    );

    return result.rows[0];
};

export const markPaymentAsPaid = async (
    provider: string,
    providerPaymentId: string,
    providerOrderId: string,
    webhookEventId: string
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const paymentResult = await client.query(
            `SELECT
                id,
                user_id,
                subscription_id,
                provider,
                provider_payment_id,
                provider_order_id,
                amount,
                currency,
                status,
                plan,
                created_at,
                updated_at
             FROM payment_transactions
             WHERE provider = $1
               AND provider_order_id = $2
             FOR UPDATE`,
            [
                provider,
                providerOrderId
            ]
        );

        if (paymentResult.rows.length === 0) {
            throw new Error(
                "Payment transaction not found"
            );
        }

        const payment = paymentResult.rows[0];

        if (payment.status === "paid") {
            await client.query("COMMIT");

            return payment;
        }

        const updateResult = await client.query(
            `UPDATE payment_transactions
             SET
                provider_payment_id = $1,
                status = 'paid',
                webhook_event_id = $2,
                updated_at = NOW()
             WHERE id = $3
               AND status = 'pending'
             RETURNING
                id,
                user_id,
                subscription_id,
                provider,
                provider_payment_id,
                provider_order_id,
                amount,
                currency,
                status,
                plan,
                webhook_event_id,
                created_at,
                updated_at`,
            [
                providerPaymentId,
                webhookEventId,
                payment.id
            ]
        );

        if (updateResult.rows.length === 0) {
            await client.query("COMMIT");

            return payment;
        }

        const updatedPayment =
            updateResult.rows[0];

        if (
            payment.subscription_id &&
            payment.plan
        ) {
            await client.query(
                `UPDATE subscriptions
                 SET
                    plan = $1,
                    status = 'active',
                    current_period_start = NOW(),
                    current_period_end =
                        NOW() + INTERVAL '30 days',
                    updated_at = NOW()
                 WHERE id = $2`,
                [
                    payment.plan,
                    payment.subscription_id
                ]
            );
        }

        await client.query("COMMIT");

        return updatedPayment;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const markPaymentAsFailed = async (
    provider: string,
    providerOrderId: string,
    webhookEventId: string
) => {
    const result = await pool.query(
        `UPDATE payment_transactions
     SET
        status = 'failed',
        webhook_event_id = $1,
        updated_at = NOW()
     WHERE provider = $2
       AND provider_order_id = $3
     RETURNING
        id,
        user_id,
        subscription_id,
        provider,
        provider_payment_id,
        provider_order_id,
        amount,
        currency,
        status,
        plan,
        webhook_event_id,
        created_at,
        updated_at`,
        [
            webhookEventId,
            provider,
            providerOrderId
        ]
    );

    if (result.rows.length === 0) {
        throw new Error("Payment transaction not found");
    }

    return result.rows[0];
};

export const createPaymentOrder = async (
    userId: string,
    plan: "pro" | "team"
) => {
    const amount =
        subscriptionPlans[plan].price * 100;

    const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `pb_${Date.now()}`
    });

    const subscriptionResult = await pool.query(
        `SELECT id
         FROM subscriptions
         WHERE user_id = $1`,
        [userId]
    );

    if (subscriptionResult.rows.length === 0) {
        throw new Error("Subscription not found");
    }

    const payment = await createPaymentTransaction(
        userId,
        subscriptionResult.rows[0].id,
        "razorpay",
        order.id,
        amount,
        "INR",
        plan
    );

    return {
        order,
        payment
    };
};

export const getUserPayments = async (
    userId: string
) => {
    const result = await pool.query(
        `SELECT
            id,
            provider,
            provider_payment_id,
            provider_order_id,
            amount,
            currency,
            status,
            plan,
            created_at,
            updated_at
         FROM payment_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
    );

    return result.rows;
};