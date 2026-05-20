import { handleCreateRazorpayOrder } from "@/lib/razorpay-api";

export async function POST(request: Request) {
  return handleCreateRazorpayOrder(request);
}
