import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import commentRoutes from "./routes/comments";
import adminRoutes from "./routes/admin";
import { errorHandler } from "./middleware/error";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`🚀 Backend listening on :${port}`));
