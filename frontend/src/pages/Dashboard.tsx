import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // post form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [published, setPublished] = useState(true);
  const [msg, setMsg] = useState("");

  const loadAdmin = async () => {
    if (!isAdmin) return;
    const [s, p, u] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/comments/pending"),
      api.get("/admin/users"),
    ]);
    setStats(s.data); setPending(p.data); setUsers(u.data);
  };
  useEffect(() => { loadAdmin(); }, []);

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/posts", {
        title, content,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        featuredImage: featuredImage || null,
        published,
      });
      setTitle(""); setContent(""); setTags(""); setFeaturedImage("");
      setMsg("✅ Post created");
    } catch (e: any) { setMsg(e.response?.data?.error || "Error"); }
  };

  const approve = async (id: string) => { await api.patch(`/comments/${id}/approve`); loadAdmin(); };
  const del = async (id: string) => { await api.delete(`/comments/${id}`); loadAdmin(); };
  const setRole = async (id: string, role: string) => { await api.patch(`/admin/users/${id}/role`, { role }); loadAdmin(); };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isAdmin && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Users", stats.users], ["Posts", stats.posts],
            ["Comments", stats.comments], ["Pending", stats.pendingComments],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-white p-4 rounded shadow">
              <p className="text-sm text-gray-500">{k}</p>
              <p className="text-2xl font-bold">{v as number}</p>
            </div>
          ))}
        </div>
      )}

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Create Post</h2>
        <form onSubmit={createPost} className="space-y-2">
          <input className="w-full p-2 border rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input className="w-full p-2 border rounded" placeholder="Featured image URL" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} />
          <input className="w-full p-2 border rounded" placeholder="tags, comma, separated" value={tags} onChange={(e) => setTags(e.target.value)} />
          <textarea className="w-full p-2 border rounded" rows={6} placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} required />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
          </label>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      </section>

      {isAdmin && (
        <>
          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">Pending Comments ({pending.length})</h2>
            {pending.length === 0 && <p className="text-sm text-gray-500">All clear 🎉</p>}
            <ul className="space-y-2">
              {pending.map((c) => (
                <li key={c.id} className="border rounded p-3 flex justify-between items-start gap-3">
                  <div>
                    <p className="text-sm font-medium">{c.author.name} on "{c.post.title}"</p>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve(c.id)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
                    <button onClick={() => del(c.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-3">Users</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="border rounded p-1">
                        <option>READER</option>
                        <option>AUTHOR</option>
                        <option>ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
