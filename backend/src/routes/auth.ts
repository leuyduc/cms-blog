import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../utils/prisma";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: "Email already in use" });
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, password: hashed, name: data.name, role: "READER" },
    });
    const token = sign(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = sign(user);
    res.json({ token, user: safeUser(user) });
  } catch (e) {
    next(e);
  }
});

function sign(user: { id: string; email: string; role: any }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions,
  );
}

function safeUser(u: any) {
  const { password, ...rest } = u;
  return rest;
}

export default router;
