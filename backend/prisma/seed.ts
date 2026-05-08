import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  const samples = [
    { title: "Welcome to the CMS Blog", tags: ["intro", "welcome"] },
    { title: "Getting Started with Docker", tags: ["devops", "docker"] },
    { title: "Why Postgres is Great", tags: ["database", "postgres"] },
    { title: "Caching with Redis", tags: ["redis", "performance"] },
    { title: "Background Jobs with BullMQ", tags: ["queue", "bullmq"] },
  ];

  for (const s of samples) {
    const slug = slugify(s.title, { lower: true, strict: true });
    await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        title: s.title,
        slug,
        content: `# ${s.title}\n\nThis is a sample post about ${s.tags.join(", ")}.`,
        featuredImage: `https://picsum.photos/seed/${slug}/800/400`,
        tags: s.tags,
        published: true,
        authorId: admin.id,
      },
    });
  }

  console.log("✅ Seed complete. Admin: admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
