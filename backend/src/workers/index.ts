import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "../utils/redis";
import { COMMENT_QUEUE } from "../queues/commentQueue";

console.log("👷 Worker starting, listening on queue:", COMMENT_QUEUE);

new Worker(
  COMMENT_QUEUE,
  async (job) => {
    const { commentId, postId, postAuthorId } = job.data as {
      commentId: string;
      postId: string;
      postAuthorId: string;
    };
    console.log(
      `[worker] Email notification sent to post author: ${postAuthorId} (post: ${postId}, comment: ${commentId})`,
    );
  },
  { connection: redis },
).on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});
