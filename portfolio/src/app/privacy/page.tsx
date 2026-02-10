import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for qualuo.github.io detailing analytics usage, cookies, contact form data handling, and opt-out options.",
  alternates: { canonical: canonicalUrl("/privacy") },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
