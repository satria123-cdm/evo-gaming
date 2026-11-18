"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/pricing";

type Product = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

type TableOption = { id: number; tableNumber: string };

const CATEGORY_LABELS: Record<string, string> = {
  food: "Makanan",
  drink: "Minuman",
};

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍜",
  drink: "🥤",
};

export function MenuOrder({
  products,
  tables,
}: {
  products: Product[];
  tables: TableOption[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [tableId, setTableId] = useState<string>("");
  const [bookingCode, setBookingCode] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const list = map.get(product.category) ?? [];
      list.push(product);
      map.set(product.category, list);
    }
    return [...map.entries()];
  }, [products]);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const product = products.find((item) => item.id === Number(id));
          if (!product || quantity <= 0) return null;
          return {
            product,
            quantity,
            lineTotal: product.price * quantity,
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [cart, products],
  );

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);

  function changeQuantity(product: Product, delta: number) {
    setError(null);
    setCart((current) => {
      const next = { ...current };
      const value = (next[product.id] ?? 0) + delta;
      if (value <= 0) delete next[product.id];
      else if (value > product.stockQuantity) return current;
      else next[product.id] = value;
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (totalItems === 0) {
      setError("Pilih minimal satu menu.");
      return;
    }
    if (!tableId && bookingCode.trim().length === 0) {
      setError("Pilih nomor meja atau masukkan kode booking.");
      return;
    }
    if (!tableId) {
      setError("Nomor meja wajib dipilih.");
      return;
    }
    if (whatsapp.trim().length < 8) {
      setError("Nomor WhatsApp wajib diisi dengan benar.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          whatsapp,
          tableId: tableId ? Number(tableId) : undefined,
          bookingCode: bookingCode.trim() || undefined,
          items: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Pesanan gagal dibuat.");
        return;
      }
      router.push(`/order/${payload.order.code}`);
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <div className="space-y-6">
        {products.length === 0 && (
          <p className="card p-5 text-sm text-slate-400">
            Menu belum tersedia. Silakan tanya petugas.
          </p>
        )}

        {grouped.map(([category, items]) => (
          <section key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{CATEGORY_ICONS[category] ?? "🍽️"}</span>
              <h2 className="display-title text-xl">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <span className="chip border-line bg-night/60 text-slate-400">
                {items.length} pilihan
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((product) => {
                const soldOut = !product.isAvailable || product.stockQuantity <= 0;
                const quantity = cart[product.id] ?? 0;
                return (
                  <li
                    key={product.id}
                    className={`group overflow-hidden rounded-2xl border border-line/70 bg-panel/60 transition ${
                      soldOut ? "opacity-60" : "hover:border-accent/50 hover:shadow-[0_18px_45px_-30px_rgba(34,211,238,0.8)]"
                    }`}
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-night/60">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-accent/15 via-panel to-accent-2/15">
                          <span className="font-display text-3xl font-bold tracking-[0.2em] text-white/20">
                            EVO
                          </span>
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded-full bg-night/80 px-2.5 py-1 font-display text-xs font-bold text-accent backdrop-blur">
                        {formatRupiah(product.price)}
                      </span>
                      {soldOut && (
                        <span className="absolute inset-0 grid place-items-center bg-night/70 font-display text-sm font-bold uppercase tracking-widest text-rose-200">
                          Habis
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 p-3.5">
                      <div>
                        <p className="font-display font-bold leading-tight">{product.name}</p>
                        {product.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-500">
                          stok {product.stockQuantity}
                        </span>
                        {soldOut ? (
                          <span className="chip border-slate-500/40 bg-slate-500/10 text-slate-300">
                            Habis
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Kurangi ${product.name}`}
                              className="h-8 w-8 rounded-lg border border-line text-lg leading-none text-slate-200 hover:border-accent/60"
                              onClick={() => changeQuantity(product, -1)}
                              disabled={quantity === 0}
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-display text-sm font-bold">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Tambah ${product.name}`}
                              className="h-8 w-8 rounded-lg border border-line text-lg leading-none text-slate-200 hover:border-accent/60"
                              onClick={() => changeQuantity(product, 1)}
                              disabled={quantity >= product.stockQuantity}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card glow-ring space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="display-title text-lg">Pesanan</h2>
            <span className="chip border-accent/30 bg-accent/10 text-accent">
              {totalItems} item
            </span>
          </div>

          {lines.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada item dipilih.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.product.id} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    {line.product.name}
                    <span className="text-slate-500"> × {line.quantity}</span>
                  </span>
                  <span className="font-semibold">{formatRupiah(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-line/70 pt-3">
            <span className="text-sm text-slate-400">Total</span>
            <span className="font-display text-2xl font-bold text-accent">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <div>
            <label className="label" htmlFor="order-table">
              Nomor meja <span className="text-rose-300">*</span>
            </label>
            <select
              id="order-table"
              className="input"
              value={tableId}
              onChange={(event) => setTableId(event.target.value)}
              required
            >
              <option value="">— Pilih meja —</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Meja {table.tableNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="order-name">
              Nama pemesan <span className="text-rose-300">*</span>
            </label>
            <input
              id="order-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama untuk pesanan"
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="order-wa">
              Nomor WhatsApp <span className="text-rose-300">*</span>
            </label>
            <input
              id="order-wa"
              className="input"
              inputMode="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="08xxxxxxxxxx"
              minLength={8}
              maxLength={20}
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Dipakai untuk mengecek pesanan di halaman Cek pesanan.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="order-booking">
              Kode booking (opsional)
            </label>
            <input
              id="order-booking"
              className="input uppercase"
              value={bookingCode}
              onChange={(event) => setBookingCode(event.target.value)}
              placeholder="EVO-XXXXXX"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Isi kode booking untuk menautkan pesanan ke sesi dan meja Anda.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting || totalItems === 0}
          >
            {submitting ? "Mengirim…" : "Pesan & bayar QRIS"}
          </button>

          <p className="text-xs text-slate-500">
            Setelah pesanan dibuat, Anda diarahkan ke halaman pembayaran QRIS
            (mode simulasi di lingkungan lokal). Stok dikurangi saat pesanan masuk
            dan otomatis dikembalikan bila pembayaran tidak diselesaikan.
          </p>
        </div>
      </aside>
    </form>
  );
}
