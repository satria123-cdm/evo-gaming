import { jsonError } from "@/lib/api";
import { listProducts } from "@/lib/orders";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limit = rateLimit(clientKey(request, "products"), {
      limit: 120,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return Response.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429 },
      );
    }

    const products = await listProducts();
    return Response.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        stockQuantity: product.stockQuantity,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
