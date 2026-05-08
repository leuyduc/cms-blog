import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

interface Post {
  id: string; slug: string; title: string; featuredImage?: string | null;
  tags: string[]; author: { name: string }; createdAt: string;
}

export default function Home() {
  const [items, setItems] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await api.get("/posts", { params: { page, q } });
    setItems(data.items);
    setTotalPages(data.totalPages);
  };
  useEffect(() => { load(); }, [page]);

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}
        className="mb-6 flex gap-2"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or tag..."
          className="flex-1 px-3 py-2 border rounded" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Search</button>
      </form>

      <div className="grid gap-4">
        {items.map((p) => (
          <Link key={p.id} to={`/posts/${p.slug}`} className="block bg-white p-4 rounded shadow hover:shadow-md">
            {p.featuredImage && (
              <img src={p.featuredImage} alt={p.title} className="w-full h-48 object-cover rounded mb-3" />
            )}
            <h2 className="text-xl font-semibold">{p.title}</h2>
            <p className="text-sm text-gray-500">by {p.author.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {p.tags.map((t) => <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">#{t}</span>)}
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span className="px-3 py-1">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
