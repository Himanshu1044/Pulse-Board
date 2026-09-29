import express from 'express';
import authRoute from './routes/authRoutes'
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from './routes/taskRoutes';
import commentRoutes from "./routes/commentRoutes";
import activityLogRoutes from "./routes/activityLogRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import notificationPreferenceRoutes from "./routes/notificationPreferenceRoutes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoute);
app.use("/api/projects", projectRoutes);
app.use("/api/", taskRoutes);
app.use("/api", commentRoutes);
app.use("/api", activityLogRoutes);
app.use("/api", notificationRoutes);
app.use("/api", notificationPreferenceRoutes);

export default app;