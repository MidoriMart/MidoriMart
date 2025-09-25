// src/App.jsx
import React, { useEffect, useState } from "react";

const API_BASE = "/api";

export default function App() {
  const [products, setProducts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: "",
    title: "",
    price: "",
    image: "",
    url: "",
    tag: ""
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/get-products`);
      const data = await r.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function startAdd() {
    setForm({ id: `p-${Date.now()}`, title: "", price: "", image: "", url: "", tag: "" });
  }

  function startEdit(p) {
    setForm({ ...p });
  }

  async function autoFill() {
    if (!form.url) return alert("Vui lòng nhập URL");
    try {
      const r = await fetch(`${API_BASE}/fetch-metadata?url=${encodeURIComponent(form.url)}`);
      const j = await r.json();
      setForm(f => ({ ...f, title: j.title || f.title, image: j.image || f.image, price: j.price || f.price }));
    } catch (err) {
      alert("Không lấy được metadata");
    }
  }

  async function saveLocalAndRemote() {
    // update local UI
    setProducts(p => {
      const other = p.filter(x => x.id !== form.id);
      return [form, ...other];
    });
    // call update-products to commit to GitHub (admin only)
    if (!isAdmin) return alert("Bạn chưa đăng nhập admin");
    try {
      const r = await fetch(`${API_BASE}/update-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPass },
        body: JSON.stringify({ products: [form, ...products.filter(x => x.id !== form.id)], message: `Update by admin web - ${form.id}` })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || JSON.stringify(j));
      alert("Lưu thành công (đã commit lên repo).");
      fetchProducts();
      setForm({ id: "", title: "", price: "", image: "", url: "", tag: "" });
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Xác nhận xóa?")) return;
    const newList = products.filter(p => p.id !== id);
    if (!isAdmin) return alert("Bạn chưa đăng nhập admin");
    try {
      const r = await fetch(`${API_BASE}/update-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPass },
        body: JSON.stringify({ products: newList, message: `Delete ${id} by admin web` })
      });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.message || JSON.stringify(j));
      }
      alert("Xóa thành công.");
      fetchProducts();
    } catch (err) {
      alert("Xóa lỗi: " + err.message);
    }
  }

  function copyAffiliateLink(p) {
    const link = generateAffiliateLink(p.url, p.tag);
    navigator.clipboard?.writeText(link);
    alert("Đã sao chép link");
  }

  function generateAffiliateLink(url, tag) {
    if (!tag) return url;
    const paramName = "aff_id";
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${paramName}=${encodeURIComponent(tag)}`;
  }

  function adminLogin() {
    if (!adminPass) return alert("Nhập mật khẩu admin");
    // test by calling update-products with same list but no change (server validates password)
    // here we just set isAdmin true; failure will be caught on save
    setIsAdmin(true);
    alert("Bạn đã đăng nhập admin tạm thời (lưu ý: quyền thực sự kiểm tra khi lưu).");
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"' }}>
      <h1>Midori Mart</h1>

      <div style={{ marginBottom: 12 }}>
        <strong>Admin:</strong>
        <input type="password" placeholder="Mật khẩu admin" value={adminPass} onChange={e=>setAdminPass(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={adminLogin} style={{ marginLeft: 8 }}>Đăng nhập</button>
        <button onClick={()=>{ setIsAdmin(false); setAdminPass(''); alert('Đã logout'); }} style={{ marginLeft: 8 }}>Logout</button>
        <span style={{ marginLeft: 12 }}>{isAdmin ? 'Bạn là admin' : 'Chưa là admin'}</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>{form.id ? 'Chỉnh sửa / Thêm sản phẩm' : 'Chọn sản phẩm để chỉnh sửa'}</h3>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <button onClick={startAdd}>Thêm mới</button>
            <button onClick={autoFill}>Auto-fill từ URL</button>
            <button onClick={saveLocalAndRemote}>Lưu (commit)</button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8, maxWidth:520 }}>
            <input placeholder="Title" value={form.title} onChange={e=>setForm(s=>({...s, title:e.target.value}))} />
            <input placeholder="Price" value={form.price} onChange={e=>setForm(s=>({...s, price:e.target.value}))} />
            <input placeholder="Image URL" value={form.image} onChange={e=>setForm(s=>({...s, image:e.target.value}))} />
            <input placeholder="Product URL" value={form.url} onChange={e=>setForm(s=>({...s, url:e.target.value}))} />
            <input placeholder="Affiliate tag" value={form.tag} onChange={e=>setForm(s=>({...s, tag:e.target.value}))} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Danh sách sản phẩm {loading ? '(loading...)' : `(${products.length})`}</h3>
          <div style={{ display:'grid', gap:8 }}>
            {products.map(p => (
              <div key={p.id} style={{ border:'1px solid #eee', padding:8, borderRadius:8, display:'flex', gap:8 }}>
                <img src={p.image || 'https://via.placeholder.com/80'} alt="" style={{ width:80, height:80, objectFit:'cover' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{p.title}</div>
                  <div style={{ color:'#666' }}>{p.price ? `Giá: ${p.price}` : ''}</div>
                  <div style={{ marginTop:8, display:'flex', gap:8 }}>
                    <button onClick={()=>window.open(generateAffiliateLink(p.url,p.tag),'_blank')}>Mở</button>
                    <button onClick={()=>copyAffiliateLink(p)}>Sao chép</button>
                    {isAdmin && <button onClick={()=>startEdit(p)}>Sửa</button>}
                    {isAdmin && <button onClick={()=>deleteProduct(p.id)} style={{ color:'red' }}>Xóa</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop:20 }}>
        <small>Ghi chú: Người xem bình thường chỉ xem & bấm mở (mở link dẫn tới Shopee). Bạn (admin) nhập mật khẩu để thêm/chỉnh sửa.</small>
      </div>
    </div>
  );
}
