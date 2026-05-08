import { Router } from "express";
import { prisma } from "../utils/prisma";
import { authRequired, requireRole } from "../middleware/auth";

const router = Router();

router.use(authRequired, requireRole("ADMIN"));

router.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const role = req.body.role;
    if (!["ADMIN", "AUTHOR", "READER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get("/stats", async (_req, res, next) => {
  try {
    const [users, posts, comments, pending] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.comment.count({ where: { approved: false } }),
    ]);
    res.json({ users, posts, comments, pendingComments: pending });
  } catch (e) {
    next(e);
  }
});

export default router;
