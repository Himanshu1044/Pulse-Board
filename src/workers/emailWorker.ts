import { Worker } from "bullmq";
import "dotenv/config";
import { sendVerificationEmail } from "../services/emailService.js";

const emailWorker = new Worker(
  "pulseboard-email",
  async (job) => {
    console.log("Processing email job:", job.name);

    await sendVerificationEmail(
      job.data.email,
      job.data.code
    );
  },
  {
    connection: {
      url: process.env.REDIS_URL
    }
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error);
});

console.log("Email worker is running");