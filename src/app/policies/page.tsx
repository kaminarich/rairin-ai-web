import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms, Refunds & Privacy | RaiRin-AI",
  description: "RaiRin-AI terms and conditions, refund policy, privacy policy, and business contact.",
};

export default function Page() {
  return <PolicyPage />;
}
