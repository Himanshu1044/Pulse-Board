import { Queue } from "bullmq";
import "dotenv/config";

const emailQueue = new Queue("pulseboard-email", {
  connection: {
    url: process.env.REDIS_URL
  }
});

export default emailQueue;