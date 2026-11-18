"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/pricing";

type Product = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  food: "Makanan",
  drink: "Minuman",
};

/** Quick picks for photos already shipped in `public/menu/`. */
const PHOTO_PRESETS = [
  { label: "Mie Goreng", url: "/menu/mie-goreng.jpg" },
  { label: "Mie Goreng + Telur", url: "/menu/mie-goreng-telur.jpg" },
  { label: "Mie Soto", url: "/menu/mie-soto.jpg" },
  { label: "Mie Soto + Telur", url: "/menu/mie-soto-telur.jpg" },
];

type FormState = {
  id: number | null;
  name: string;
  category: "food" | "drink";
  description: string;
  imageUrl: string;
  price: string;
  stockQuantity: string;
  isAvailable: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  category: "drink",
  description: "",
  imageUrl: "",
  price: "",
  stockQuantity: "0",
  isAvailable: true,
};

export function AdminProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  function startEdit(product: Product) {
    setError(null);
    setNotice(null);
    setForm({
      id: product.id,
      name: product.name,
      category: product.category === "food" ? "food" : "drink",
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
      isAvailable: product.isAvailable,
    });
  }

  async function reload() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setProducts(payload.products ?? []);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const body = {
      name: form.name,
      category: form.category,
      description: form.description,
      imageUrl: form.imageUrl,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      isAvailable: form.isAvailable,
    };

    try {
      const editing = form.id !== null;
      const response = await fetch(
        editing ? `/api/admin/products/${form.id}` : "/api/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal menyimpan produk.");
        return;
      }
      setNotice(editing ? "Produk diperbarui." : "Produk ditambahkan.");
      resetForm();
      await reload();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSaving(false);
    }
  }

  async function patchProduct(product: Product, patch: Record<string, unknown>) {
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal memperbarui produk.");
        return;
      }
      await reload();
    } catch {
      setError("Tidak dapat menghubungi server.");
    }
  }

  async function removeProduct(product: Product) {
    const confirmed = window.confirm(
      `Hapus "${product.name}" dari menu? Riwayat pesanan tetap tersimpan.`,
    );
    if (!confirmed) return;

    setError(null);
    setNotice(null);
    setDeletingId(product.id);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Gagal menghapus produk.");
        return;
      }
      if (form.id === product.id) resetForm();
      setNotice(`"${product.name}" dihapus.`);
      await reload();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <section className="space-y-3">
        {error && (
          <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            {notice}
          </p>
        )}

        {products.length === 0 ? (
          <p className="card p-5 text-sm text-slate-400">Belum ada produk.</p>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <article
                key={product.id}
                className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line/70 bg-night/60">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-accent/15 to-accent-2/15 font-display text-[10px] font-bold tracking-widest text-white/30">
                        EVO
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold">
                      {product.name}
                      <span className="ml-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        {CATEGORY_LABELS[product.category] ?? product.category}
                      </span>
                    </p>
                    {product.description && (
                      <p className="truncate text-xs text-slate-400">{product.description}</p>
                    )}
                    <p className="mt-1 text-sm">
                      <span className="font-semibold text-accent">
                        {formatRupiah(product.price)}
                      </span>
                      <span className="ml-3 text-slate-400">Stok {product.stockQuantity}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`chip ${
                      product.isAvailable
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border-slate-500/40 bg-slate-500/10 text-slate-300"
                    }`}
                  >
                    {product.isAvailable ? "Tersedia" : "Habis"}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:border-accent/60"
                    onClick={() => startEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:border-accent/60"
                    onClick={() =>
                      void patchProduct(product, { isAvailable: !product.isAvailable })
                    }
                  >
                    {product.isAvailable ? "Set habis" : "Set tersedia"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-400/40 px-2.5 py-1 text-xs font-semibold text-rose-200 hover:border-rose-300 hover:bg-rose-400/10 disabled:opacity-50"
                    onClick={() => void removeProduct(product)}
                    disabled={deletingId === product.id}
                  >
                    {deletingId === product.id ? "Menghapus…" : "Hapus"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <form onSubmit={handleSubmit} className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {form.id === null ? "Tambah produk" : "Edit produk"}
            </h2>
            {form.id !== null && (
              <button
                type="button"
                className="text-xs font-semibold text-slate-400 hover:text-accent"
                onClick={resetForm}
              >
                Batal
              </button>
            )}
          </div>

          <div>
            <label className="label" htmlFor="product-name">
              Nama produk
            </label>
            <input
              id="product-name"
              className="input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div>
            <label className="label" htmlFor="product-category">
              Kategori
            </label>
            <select
              id="product-category"
              className="input"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value as "food" | "drink" })
              }
            >
              <option value="drink">Minuman</option>
              <option value="food">Makanan</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="product-description">
              Deskripsi (opsional)
            </label>
            <input
              id="product-description"
              className="input"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              maxLength={300}
            />
          </div>

          <div>
            <label className="label" htmlFor="product-image">
              Foto produk (URL, opsional)
            </label>
            <input
              id="product-image"
              className="input"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="/menu/mie-goreng.jpg atau https://…"
              maxLength={500}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Bisa memakai path lokal di <code>public/</code> atau URL gambar penuh.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PHOTO_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-accent/60 hover:text-accent"
                  onClick={() => setForm({ ...form, imageUrl: preset.url })}
                >
                  {preset.label}
                </button>
              ))}
              {form.imageUrl && (
                <button
                  type="button"
                  className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-200"
                  onClick={() => setForm({ ...form, imageUrl: "" })}
                >
                  Hapus foto
                </button>
              )}
            </div>
            {form.imageUrl && (
              <div className="mt-2 h-24 w-full overflow-hidden rounded-xl border border-line/70 bg-night/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Pratinjau foto produk"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="product-price">
                Harga (Rp)
              </label>
              <input
                id="product-price"
                type="number"
                inputMode="numeric"
                min={0}
                className="input"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="product-stock">
                Stok
              </label>
              <input
                id="product-stock"
                type="number"
                inputMode="numeric"
                min={0}
                className="input"
                value={form.stockQuantity}
                onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })}
            />
            Tersedia untuk dipesan
          </label>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? "Menyimpan…" : form.id === null ? "Tambah produk" : "Simpan perubahan"}
          </button>
        </form>

        <p className="text-[11px] leading-relaxed text-slate-500">
          Stok berkurang otomatis saat pelanggan memesan dan kembali saat pesanan dibatalkan.
          Menyetel stok manual di sini menimpa angka saat ini.
        </p>
      </aside>
    </div>
  );
}
