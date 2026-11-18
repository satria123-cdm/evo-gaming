import { ApiError } from "@/lib/api";
import { getAdminSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new ApiError(401, "Silakan login sebagai admin.", "unauthorized");
  }
  return session;
}
