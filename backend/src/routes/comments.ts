import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authRequired, requireRole } from "../middleware/auth";
import { commentQueue } from "../queues/commentQueue";
import { cacheDelPattern } from "../utils/redis";

const router = Router();

const createSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const post = await prisma.post.findUnique({ where: { id: data.postId } });
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId: req.user!.id,
        approved: false,
      },
    });

    await commentQueue.add("notify", {
      commentId: comment.id,
      postId: post.id,
      postAuthorId: post.authorId,
    });

    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

router.get("/post/:postId", async (req, res, next) => {
  try {
    const items = await prisma.comment.findMany({
      where: { postId: req.params.postId, approved: true },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.get("/pending", authRequired, requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const items = await prisma.comment.findMany({
      where: { approved: false },
      include: {
        author: { select: { id: true, name: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/approve", authRequired, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const c = await prisma.comment.update({
      where: { id: req.params.id },
      data: { approved: true },
    });
    await cacheDelPattern("post:slug:*");
    res.json(c);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", authRequired, requireRole("ADMIN"), async (req, res, next) => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    await cacheDelPattern("post:slug:*");
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
