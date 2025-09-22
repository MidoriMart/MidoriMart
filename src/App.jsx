import React, { useEffect, useState } from "react";

export default function App() {
  const [products, setProducts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sf_products") || "[]");
    } catch (e) {
      return [];
    }
  });

  const [form, setForm] = useState({
    title: "",
    price: "",
    image: "",
    url: "",
    tag: "",
  });

  useEffect(() => {
    localStorage.setItem("sf_products", JSON.stringify(products));
  }, [products]);

  function resetForm() {
    setForm({ title: "", price: "", image: "", url: "", tag: "" });
  }

  function addProduct(e) {
    e?.preventDefault();
    if (!form.title || !form.url) {
      alert("Vui lòng điền ít nhất tiêu đề và URL sản phẩm.");
      return;
    }
    const newProduct = {
      id: Date.now().toString(),
      ...form,
    };
    setProducts((p) => [newProduct, ...p]);
    resetForm();
  }

  function removeProduct(id) {
    if (!confirm("Xác nhận xóa sản phẩm này?")) return;
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  function editProduct(id) {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    setForm({
      title: prod.title,
      price: prod.price,
      image: prod.image,
      url: prod.url,
      tag: prod.tag,
    });
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  function generateAffiliateLink(url, tag) {
    if (!tag) return url;
    const paramName = "aff_id";
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${paramName}=${encodeURIComponent(tag)}`;
  }

  function copyAffiliateLink(p) {
    const link = generateAffiliateLink(p.url, p.tag);
    navigator.clipboard
      ?.writeText(link)
      .then(() => {
        alert("Đã sao chép link affiliate vào clipboard.");
      })
      .catch(() => alert("Không thể sao chép — hãy thử thủ công."));
  }

  function exportJSON() {
    const data = JSON.stringify(products, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopee_aff_products.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) {
          setProducts((p) => data.concat(p));
          alert("Đã import.");
        } else alert("File không đúng định dạng.");
      } catch (err) {
        alert("Không thể đọc file JSON.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Shopee Affiliate Store</h1>
            <p className="text-sm text-slate-600">
              Thêm các sản phẩm Shopee (affiliate) và chia sẻ cửa hàng cá nhân.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => exportJSON()} className="px-3 py-1 rounded-lg border text-sm">
              Export JSON
            </button>
            <label className="px-3 py-1 rounded-lg border text-sm cursor-pointer">
              Import
              <input type="file" accept="application/json" onChange={importJSON} className="hidden" />
            </label>
            <button
              onClick={() => {
                localStorage.removeItem("sf_products");
                setProducts([]);
              }}
              className="px-3 py-1 rounded-lg border text-sm"
              title="Xóa tất cả (chỉ trong trình duyệt này)"
            >
              Clear
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-sm">
            <h2 className="font-semibold mb-3">Thêm sản phẩm</h2>
            <form onSubmit={addProduct} className="flex flex-col gap-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Tiêu đề"
                className="input"
              />
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Giá (tùy chọn)"
                className="input"
              />
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="Ảnh (URL)"
                className="input"
              />
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="Link sản phẩm hoặc link affiliate đã tạo"
                className="input"
              />
              <input
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                placeholder="Affiliate tag (ví dụ mã của bạn)"
                className="input"
              />

              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn">
                  Thêm / Lưu
                </button>
                <button type="button" onClick={resetForm} className="btn-ghost">
                  Reset
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Ghi chú: Nếu bạn đã có link affiliate từ Shopee, dán trực tiếp vào ô Link sản phẩm. Nếu không, dán link gốc và thêm "Affiliate tag" để app ghép link.
              </p>
            </form>

            <hr className="my-4" />
            <div className="text-sm">
              <strong>Tip deploy miễn phí:</strong>
              <ul className="list-disc ml-4 mt-2 text-slate-600">
                <li>Push mã lên GitHub và deploy trên Vercel / Netlify (hỗ trợ miễn phí).</li>
                <li>Hoặc build thành static và host trên GitHub Pages.</li>
              </ul>
            </div>
          </section>

          <section className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Sản phẩm ({products.length})</h2>
              <div className="text-sm text-slate-500">Lưu trữ: <strong>localStorage</strong> (chỉ trên trình duyệt này)</div>
            </div>

            {products.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl shadow-sm text-center text-slate-500">Chưa có sản phẩm nào. Thêm sản phẩm ở bên trái.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p) => (
                  <article key={p.id} className="bg-white p-3 rounded-xl shadow-sm flex gap-3">
                    <div className="w-28 h-28 bg-slate-100 rounded-md flex-shrink-0 overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-semibold text-sm truncate">{p.title}</h3>
                      <div className="text-xs text-slate-500 mt-1">{p.price ? `Giá: ${p.price}` : ""}</div>
                      <div className="mt-auto flex items-center gap-2">
                        <button onClick={() => window.open(generateAffiliateLink(p.url, p.tag), "_blank")} className="px-2 py-1 rounded-md border text-sm">Mở</button>
                        <button onClick={() => copyAffiliateLink(p)} className="px-2 py-1 rounded-md border text-sm">Sao chép link</button>
                        <button onClick={() => editProduct(p.id)} className="px-2 py-1 rounded-md border text-sm">Sửa</button>
                        <button onClick={() => removeProduct(p.id)} className="px-2 py-1 rounded-md border text-sm text-red-600">Xóa</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="mt-8 text-center text-slate-500 text-sm">
          <div>Phiên bản đơn giản — miễn phí. Muốn tôi tích hợp fetch metadata hoặc kết nối API không?</div>
        </footer>
      </div>
    </div>
  );
}
