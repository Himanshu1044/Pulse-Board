import express from 'express';
import authRoute from './routes/authRoutes'
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from './routes/taskRoutes';
import commentRoutes from "./routes/commentRoutes";
import activityLogRoutes from "./routes/activityLogRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import notificationPreferenceRoutes from "./routes/notificationPreferenceRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import paymentWebhookRoutes from "./routes/paymentWebhookRoutes";

const app = express();

app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentWebhookRoutes
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoute);
app.use("/api/projects", projectRoutes);
app.use("/api/", taskRoutes);
app.use("/api", commentRoutes);
app.use("/api", activityLogRoutes);
app.use("/api", notificationRoutes);
app.use("/api", notificationPreferenceRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api", paymentRoutes);

export default app;