import { Queue } from "bullmq";
import { redis } from "../utils/redis";

export const COMMENT_QUEUE = "comment-notifications";

export const commentQueue = new Queue(COMMENT_QUEUE, {
  connection: redis,
});
