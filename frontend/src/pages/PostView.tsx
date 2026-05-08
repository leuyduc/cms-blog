import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function PostView() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await api.get(`/posts/${slug}`);
    setPost(data);
  };
  useEffect(() => { load(); }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/comments", { postId: post.id, content: comment });
      setComment("");
      setMsg("Comment submitted — pending admin approval.");
    } catch (err: any) {
      setMsg(err.response?.data?.error || "Error");
    }
  };

  if (!post) return <p>Loading...</p>;

  return (
    <article className="bg-white p-6 rounded shadow">
      {post.featuredImage && <img src={post.featuredImage} className="w-full h-64 object-cover rounded mb-4" />}
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-4">by {post.author.name} · {new Date(post.createdAt).toLocaleDateString()}</p>
      <div className="prose whitespace-pre-wrap">{post.content}</div>

      <hr className="my-6" />
      <h2 className="text-xl font-semibold mb-3">Comments ({post.comments.length})</h2>

      {user ? (
        <form onSubmit={submit} className="mb-4">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} required
            className="w-full p-2 border rounded" rows={3} placeholder="Write a comment..." />
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Post comment</button>
          {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-4">Login to leave a comment.</p>
      )}

      <ul className="space-y-3">
        {post.comments.map((c: any) => (
          <li key={c.id} className="border rounded p-3">
            <p className="text-sm font-medium">{c.author.name}</p>
            <p className="text-sm">{c.content}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
