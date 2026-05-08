import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authRequired, requireRole } from "../middleware/auth";
import { cacheDelPattern, cacheGet, cacheSet } from "../utils/redis";

const router = Router();

// GET /api/posts?page=1&q=...
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const q = (req.query.q as string | undefined)?.trim() || "";
    const take = 10;
    const skip = (page - 1) * take;

    const cacheKey = `posts:list:${page}:${q}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const where: any = { published: true };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.post.count({ where }),
    ]);

    const payload = { items, total, page, totalPages: Math.ceil(total / take) };
    await cacheSet(cacheKey, payload, 60);
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

// GET /api/posts/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const cacheKey = `post:slug:${req.params.slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: {
        author: { select: { id: true, name: true } },
        comments: {
          where: { approved: true },
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!post) return res.status(404).json({ error: "Not found" });
    await cacheSet(cacheKey, post, 60);
    res.json(post);
  } catch (e) {
    next(e);
  }
});

const upsertSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  featuredImage: z.string().url().optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  published: z.boolean().default(false),
});

router.post("/", authRequired, requireRole("ADMIN", "AUTHOR"), async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const slug = slugify(data.title, { lower: true, strict: true }) + "-" + Date.now().toString(36);
    const post = await prisma.post.create({
      data: { ...data, slug, authorId: req.user!.id },
    });
    await invalidate();
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", authRequired, async (req, res, next) => {
  try {
    const data = upsertSchema.partial().parse(req.body);
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.user!.role !== "ADMIN" && existing.authorId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const post = await prisma.post.update({ where: { id: req.params.id }, data });
    await invalidate();
    res.json(post);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.user!.role !== "ADMIN" && existing.authorId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await prisma.post.delete({ where: { id: req.params.id } });
    await invalidate();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

async function invalidate() {
  await Promise.all([cacheDelPattern("posts:list:*"), cacheDelPattern("post:slug:*")]);
}

export default router;
