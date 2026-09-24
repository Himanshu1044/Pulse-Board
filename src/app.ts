import express from 'express';
import authRoute from './routes/authRoutes'
import projectRoutes from "./routes/projectRoutes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoute);
app.use("/api/projects", projectRoutes);
export default app;