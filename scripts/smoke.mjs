/**
 * End-to-end smoke test against a running server.
 * Usage: node scripts/smoke.mjs  (BASE_URL defaults to http://127.0.0.1:3100)
 *
 * Covers: availability, concurrent double-booking, QRIS simulation,
 * webhook idempotency, midnight cutoff, and admin login.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3100";

function envValue(key, fallback) {
  // Process env wins so the same script can test a deployed server.
  if (process.env[key]) return process.env[key];
  try {
    const file = readFileSync(".env.local", "utf8");
    const line = file.split(/\r?\n/).find((entry) => entry.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1) : fallback;
  } catch {
    return fallback;
  }
}

const adminEmail = envValue("ADMIN_EMAIL", "owner@evogaming.local");
const adminPassword = envValue("ADMIN_PASSWORD", "evoOwner123");
const gatewaySecret = envValue("MOCK_GATEWAY_SECRET", "dev-mock-gateway-secret-change-me");

let failures = 0;
function check(name, condition, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// Use a far-future date + random slot so the test can be re-run many times
// without filling up the first availble unit of a fixed window.
const testDate = new Date(Date.now() + (7 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
const testTime = `${String(11 + Math.floor(Math.random() * 10)).padStart(2, "0")}:${
  Math.random() < 0.5 ? "00" : "30"
}`;

// Rate limits are per client IP. Give each run its own IP so repeated runs
// exercise the booking flow instead of tripping the limiter.
const clientIp = `10.${1 + Math.floor(Math.random() * 254)}.${1 + Math.floor(Math.random() * 254)}.${1 + Math.floor(Math.random() * 254)}`;
const ipHeaders = { "X-Forwarded-For": clientIp };

async function json(response) {
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body, headers: response.headers };
}

// 1. Availability
const availability = await json(
  await fetch(`${base}/api/availability?date=${testDate}&time=${testTime}&duration=1`),
);
check("availability returns 8 units", availability.status === 200 && availability.body.units?.length === 8);
const firstAvailable = availability.body.units?.find((unit) => unit.available);
check("at least one unit available", Boolean(firstAvailable));

// 2. Concurrent double booking on the same unit/slot
const payload = (name, wa) => ({
  customerName: name,
  whatsapp: wa,
  date: testDate,
  time: testTime,
  durationHours: 1,
  psUnitId: firstAvailable.id,
  method: "qris",
});
const raceRequest = (name, wa) =>
  fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ipHeaders },
    body: JSON.stringify(payload(name, wa)),
  }).then(json);
const [raceA, raceB] = await Promise.all([
  raceRequest("Uji Race A", "081234567001"),
  raceRequest("Uji Race B", "081234567002"),
]);
const winner =
  raceA.status === 201
    ? { res: raceA, whatsapp: "081234567001" }
    : { res: raceB, whatsapp: "081234567002" };
const loser = raceA.status === 201 ? raceB : raceA;
check(
  "concurrent booking: exactly one succeeds",
  [raceA.status, raceB.status].sort().join(",") === "201,409",
  `statuses ${raceA.status}/${raceB.status}`,
);
check("winner has a booking code", Boolean(winner.res.body.booking?.code));
check("loser is rejected with slot_taken", loser.body.code === "slot_taken");

const bookingLookup = await json(
  await fetch(`${base}/api/bookings/lookup?wa=${encodeURIComponent(winner.whatsapp)}`, {
    headers: ipHeaders,
  }),
);
check(
  "bookings can be looked up by WhatsApp only",
  bookingLookup.status === 200 &&
    bookingLookup.body.bookings?.some(
      (booking) => booking.code === winner.res.body.booking.code,
    ),
  `status ${bookingLookup.status}`,
);

// 3. Slot is now blocked for the same window
const afterRace = await json(
  await fetch(`${base}/api/availability?date=${testDate}&time=${testTime}&duration=1`),
);
check(
  "booked unit no longer available",
  afterRace.body.units?.find((unit) => unit.id === firstAvailable.id)?.available === false,
);

// 4. Midnight cutoff
const late = await json(
  await fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...ipHeaders },
    body: JSON.stringify({
      ...payload("Uji Lewat Tengah Malam", "081234567003"),
      time: "23:00",
      durationHours: 3,
    }),
  }),
);
check("booking past 00.00 rejected", late.status === 400, late.body.error ?? "");

// 4b. Mock-mode booking page exposes the dummy QR + simulation button
const bookingPage = await fetch(
  `${base}/booking/${winner.res.body.booking.code}`,
).then((response) => response.text());
check(
  "booking page shows dummy QRIS simulation",
  bookingPage.includes("QRIS (Simulasi)") &&
    bookingPage.includes("Simulasi Bayar Berhasil"),
);

// 5. Mock QRIS payment
const reference = winner.res.body.payment.reference;
const paid = await json(
  await fetch(`${base}/api/payments/${reference}/mock`, { method: "POST" }),
);
check("mock payment confirms", paid.status === 200 && paid.body.paymentStatus === "paid");

const detail = await json(
  await fetch(
    `${base}/api/bookings/${winner.res.body.booking.code}?wa=${encodeURIComponent(winner.whatsapp)}`,
  ),
);
check(
  "lookup with whatsapp shows paid booking",
  detail.status === 200 && detail.body.paymentStatus === "paid",
);
const noWa = await json(await fetch(`${base}/api/bookings/${winner.res.body.booking.code}`));
check("lookup without whatsapp is blocked", noWa.status === 400);

// 6. Webhook idempotency (same event id twice, valid signature at second send)
const event = {
  eventId: `smoke-${Date.now()}`,
  paymentReference: reference,
  status: "paid",
  amount: winner.res.body.payment.amount,
  gatewayTransactionId: `SMOKE-${Date.now()}`,
};
const raw = JSON.stringify(event);
const signature = createHmac("sha256", gatewaySecret).update(raw).digest("hex");
const sendWebhook = () =>
  fetch(`${base}/api/webhooks/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mock-signature": signature },
    body: raw,
  }).then(json);

const firstWebhook = await sendWebhook();
const secondWebhook = await sendWebhook();
check("webhook accepted", firstWebhook.status === 200);
check("webhook replay is idempotent", secondWebhook.body.duplicate === true);

const badSignature = await fetch(`${base}/api/webhooks/payment`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-mock-signature": "deadbeef" },
  body: raw,
}).then(json);
check("webhook rejects bad signature", badSignature.status === 401);

// 7. Admin login + protected endpoint
const login = await fetch(`${base}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...ipHeaders },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
const loginBody = await login.json().catch(() => ({}));
check("admin login succeeds", login.status === 200, loginBody.error ?? "");
const cookie = login.headers.getSetCookie?.()?.[0]?.split(";")[0] ?? "";

const unauthorized = await json(
  await fetch(`${base}/api/admin/bookings/${winner.res.body.booking.code}`, { method: "PATCH" }),
);
check("admin endpoint rejects anonymous", unauthorized.status === 401);

if (cookie) {
  const list = await json(
    await fetch(`${base}/api/admin/bookings`, { headers: { Cookie: cookie } }),
  );
  const target = list.body.bookings?.find(
    (row) => row.code === winner.res.body.booking.code,
  );
  check(
    "admin list includes the new booking",
    list.status === 200 && Boolean(target),
    `status ${list.status}`,
  );

  const patch = target
    ? await json(
        await fetch(`${base}/api/admin/bookings/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ bookingStatus: "in_use" }),
        }),
      )
    : { status: 0, body: {} };
  check(
    "admin can update a booking",
    patch.status === 200 && patch.body.booking?.bookingStatus === "in_use",
    `status ${patch.status}`,
  );

  // 8. Editable package prices and menu CRUD
  const packageList = await json(
    await fetch(`${base}/api/admin/packages`, { headers: { Cookie: cookie } }),
  );
  const originalPackages = packageList.body.packages ?? [];
  check(
    "admin can read package prices",
    packageList.status === 200 && originalPackages.length >= 1,
    `status ${packageList.status}`,
  );

  if (originalPackages.length >= 1) {
    const raisedPackages = originalPackages.map((pkg) => ({
      hours: pkg.hours,
      price: pkg.price + 1000,
    }));
    const savedPackages = await json(
      await fetch(`${base}/api/admin/packages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ packages: raisedPackages }),
      }),
    );
    check(
      "admin can update package prices",
      savedPackages.status === 200 &&
        savedPackages.body.packages?.find((pkg) => pkg.hours === 1)?.price ===
          raisedPackages.find((pkg) => pkg.hours === 1)?.price,
      `status ${savedPackages.status}`,
    );

    const extraHours = Array.from({ length: 14 }, (_, index) => index + 1).find(
      (hours) => !originalPackages.some((pkg) => pkg.hours === hours),
    );
    if (extraHours) {
      const withExtra = [
        ...originalPackages.map((pkg) => ({ hours: pkg.hours, price: pkg.price })),
        { hours: extraHours, price: 20000 },
      ];
      const addedPackages = await json(
        await fetch(`${base}/api/admin/packages`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ packages: withExtra }),
        }),
      );
      check(
        "admin can add a package duration",
        addedPackages.status === 200 &&
          addedPackages.body.packages?.some((pkg) => pkg.hours === extraHours),
        `status ${addedPackages.status}`,
      );
    }

    const restoredPackages = await json(
      await fetch(`${base}/api/admin/packages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          packages: originalPackages.map((pkg) => ({
            hours: pkg.hours,
            price: pkg.price,
          })),
        }),
      }),
    );
    check(
      "deleting/restoring packages returns the original set",
      restoredPackages.status === 200 &&
        restoredPackages.body.packages?.length === originalPackages.length &&
        restoredPackages.body.packages?.find((pkg) => pkg.hours === 1)?.price ===
          originalPackages.find((pkg) => pkg.hours === 1)?.price,
      `status ${restoredPackages.status}`,
    );
  }

  const smokeProductName = `Uji Smoke ${Date.now()}`;
  const createdProduct = await json(
    await fetch(`${base}/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        name: smokeProductName,
        category: "drink",
        description: "Produk uji otomatis",
        imageUrl: "/menu/mie-soto.jpg",
        price: 5000,
        stockQuantity: 3,
        isAvailable: true,
      }),
    }),
  );
  const createdProductId = createdProduct.body.product?.id;
  check(
    "admin can create a product with a photo",
    createdProduct.status === 201 &&
      createdProduct.body.product?.imageUrl === "/menu/mie-soto.jpg",
    `status ${createdProduct.status}`,
  );

  if (createdProductId) {
    const patchedProduct = await json(
      await fetch(`${base}/api/admin/products/${createdProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ price: 6000, imageUrl: "/menu/mie-goreng.jpg" }),
      }),
    );
    check(
      "admin can edit a product",
      patchedProduct.status === 200 &&
        patchedProduct.body.product?.price === 6000 &&
        patchedProduct.body.product?.imageUrl === "/menu/mie-goreng.jpg",
      `status ${patchedProduct.status}`,
    );

    const deletedProduct = await json(
      await fetch(`${base}/api/admin/products/${createdProductId}`, {
        method: "DELETE",
        headers: { Cookie: cookie },
      }),
    );
    const remaining = await json(
      await fetch(`${base}/api/admin/products`, { headers: { Cookie: cookie } }),
    );
    check(
      "admin can delete a product",
      deletedProduct.status === 200 &&
        !remaining.body.products?.some((item) => item.id === createdProductId),
      `status ${deletedProduct.status}`,
    );
  }

  // 8. F&B menu, stock, and order lifecycle
  const menu = await json(await fetch(`${base}/api/products`));
  check(
    "product list is public",
    menu.status === 200 && (menu.body.products?.length ?? 0) >= 5,
    `status ${menu.status}`,
  );

  const items = menu.body.products ?? [];
  const water = items.find((product) => product.name === "Air Mineral") ?? items[0];
  const noodle =
    items.find((product) => product.name === "Mie Goreng") ??
    items.find((product) => product.name === "Mi Instan") ??
    items[1];
  const lowStock = [...items].sort((a, b) => a.stockQuantity - b.stockQuantity)[0];

  if (water && noodle) {
    const waterBefore = water.stockQuantity;
    const expectedSubtotal = water.price * 2 + noodle.price;

    const orderRes = await json(
      await fetch(`${base}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ipHeaders },
        body: JSON.stringify({
          customerName: "Uji Pesanan",
          whatsapp: "081234567010",
          tableId: 1,
          items: [
            { productId: water.id, quantity: 2 },
            { productId: noodle.id, quantity: 1 },
          ],
        }),
      }),
    );
    check(
      "create F&B order",
      orderRes.status === 201 && Boolean(orderRes.body.order?.code),
      `status ${orderRes.status} ${orderRes.body.error ?? ""}`,
    );
    check(
      "order subtotal uses server prices",
      orderRes.body.order?.subtotal === expectedSubtotal,
      `${orderRes.body.order?.subtotal} vs ${expectedSubtotal}`,
    );
    check(
      "F&B order starts with a pending QRIS payment",
      orderRes.body.order?.paymentStatus === "pending" &&
        Boolean(orderRes.body.payment?.reference),
      `status ${orderRes.body.order?.paymentStatus} ref ${orderRes.body.payment?.reference ?? "-"}`,
    );

    const orderCode = orderRes.body.order?.code;
    const orderPaymentRef = orderRes.body.payment?.reference;

    // The F&B order page offers the same QRIS simulation as bookings.
    const orderPage = await fetch(`${base}/order/${orderCode}`).then((response) =>
      response.text(),
    );
    check(
      "order page shows dummy QRIS simulation",
      orderPage.includes("QRIS (Simulasi)") &&
        orderPage.includes("Simulasi Bayar Berhasil"),
    );

    if (orderPaymentRef) {
      const mockPay = await json(
        await fetch(`${base}/api/payments/${orderPaymentRef}/mock`, { method: "POST" }),
      );
      check(
        "mock payment settles F&B order",
        mockPay.status === 200 && mockPay.body.paymentStatus === "paid",
        `status ${mockPay.status}`,
      );
    }
    const orderDetail = await json(
      await fetch(`${base}/api/orders/${encodeURIComponent(orderCode ?? "")}`),
    );
    check(
      "public order status lookup",
      orderDetail.status === 200 &&
        orderDetail.body.order?.status === "new" &&
        (orderDetail.body.items?.length ?? 0) === 2,
      `status ${orderDetail.status}`,
    );
    check(
      "F&B order is paid after simulation",
      orderDetail.body.order?.paymentStatus === "paid",
      `paymentStatus ${orderDetail.body.order?.paymentStatus ?? "-"}`,
    );

    const orderLookup = await json(
      await fetch(`${base}/api/orders/lookup?wa=081234567010`, { headers: ipHeaders }),
    );
    check(
      "F&B orders can be looked up by WhatsApp only",
      orderLookup.status === 200 &&
        orderLookup.body.orders?.some((order) => order.code === orderCode),
      `status ${orderLookup.status}`,
    );

    const afterOrder = await json(await fetch(`${base}/api/products`));
    const waterAfter = afterOrder.body.products?.find((product) => product.id === water.id);
    check(
      "stock decremented on order",
      waterAfter?.stockQuantity === waterBefore - 2,
      `${waterAfter?.stockQuantity} vs ${waterBefore - 2}`,
    );

    if (lowStock && lowStock.stockQuantity < 20) {
      const tooMany = await json(
        await fetch(`${base}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...ipHeaders },
          body: JSON.stringify({
            customerName: "Uji Stok Kurang",
            whatsapp: "081234567011",
            tableId: 1,
            items: [{ productId: lowStock.id, quantity: lowStock.stockQuantity + 1 }],
          }),
        }),
      );
      check(
        "insufficient stock is rejected",
        tooMany.status === 409 && tooMany.body.code === "insufficient_stock",
        `status ${tooMany.status} ${tooMany.body.code ?? ""}`,
      );
    }

    const adminOrders = await json(
      await fetch(`${base}/api/admin/orders?status=active`, { headers: { Cookie: cookie } }),
    );
    const targetOrder = adminOrders.body.orders?.find((row) => row.code === orderCode);
    check(
      "admin order queue shows the new order",
      adminOrders.status === 200 && Boolean(targetOrder),
      `status ${adminOrders.status}`,
    );

    const anonymousOrders = await json(await fetch(`${base}/api/admin/orders`));
    check("admin order queue rejects anonymous", anonymousOrders.status === 401);

    if (targetOrder) {
      const confirmed = await json(
        await fetch(`${base}/api/admin/orders/${targetOrder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ status: "confirmed", paymentStatus: "paid" }),
        }),
      );
      check(
        "admin confirms and marks order paid",
        confirmed.status === 200 &&
          confirmed.body.order?.status === "confirmed" &&
          confirmed.body.order?.paymentStatus === "paid",
        `status ${confirmed.status}`,
      );

      const cancelled = await json(
        await fetch(`${base}/api/admin/orders/${targetOrder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ status: "cancelled" }),
        }),
      );
      check(
        "admin cancels order",
        cancelled.status === 200 && cancelled.body.order?.status === "cancelled",
        `status ${cancelled.status}`,
      );

      const restored = await json(await fetch(`${base}/api/products`));
      const waterRestored = restored.body.products?.find((product) => product.id === water.id);
      check(
        "cancelling restores stock",
        waterRestored?.stockQuantity === waterBefore,
        `${waterRestored?.stockQuantity} vs ${waterBefore}`,
      );
    }
  }
}

// 9. Public pages, metadata, and SEO files
const homePage = await fetch(`${base}/`);
const homeHtml = await homePage.text();
check("homepage renders", homePage.status === 200);
check(
  "homepage ships the arcade and controller",
  homeHtml.includes("EVO Catch") &&
    homeHtml.includes("Lapangan mini game EVO Catch") &&
    homeHtml.includes("Stik PS4 interaktif"),
);
check(
  "homepage embeds LocalBusiness JSON-LD",
  homeHtml.includes('application/ld+json') &&
    homeHtml.includes('"@type":"LocalBusiness"'),
);
check(
  "homepage exposes Open Graph image",
  /property="og:image"[^>]*hero-beranda\.jpg/.test(homeHtml),
);

const sitemapRes = await fetch(`${base}/sitemap.xml`);
const sitemapXml = await sitemapRes.text();
check(
  "sitemap lists the public pages",
  sitemapRes.status === 200 && (sitemapXml.match(/<loc>/g) ?? []).length >= 5,
  `${(sitemapXml.match(/<loc>/g) ?? []).length} urls`,
);

const robotsRes = await fetch(`${base}/robots.txt`);
const robotsTxt = await robotsRes.text();
check(
  "robots blocks admin and API",
  robotsRes.status === 200 &&
    robotsTxt.includes("Disallow: /admin") &&
    robotsTxt.includes("Sitemap:"),
);

const missingRes = await fetch(`${base}/halaman-tidak-ada-${Date.now()}`);
const missingHtml = await missingRes.text();
check(
  "unknown paths get the branded 404",
  missingRes.status === 404 && missingHtml.includes("Halaman tidak ditemukan"),
  `status ${missingRes.status}`,
);

console.log(failures === 0 ? "\nSemua smoke test lulus." : `\n${failures} smoke test gagal.`);
process.exitCode = failures === 0 ? 0 : 1;
