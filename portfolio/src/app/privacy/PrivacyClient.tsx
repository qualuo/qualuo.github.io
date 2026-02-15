"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyClient() {
  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-12"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <h1 className="text-3xl font-semibold mb-8">Privacy Policy</h1>

          <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
            <p>Last updated: February 2026</p>

            <section>
              <h2 className="text-white text-lg font-medium mb-3">Analytics</h2>
              <p>
                This website uses Cloudflare Web Analytics to understand how visitors interact with the site.
                This service collects aggregate data about page views, referrers, and browser/device type.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg font-medium mb-3">Contact Form</h2>
              <p>
                When you submit the contact form, your name, email, and message are sent to me directly.
                This information is used only to respond to your inquiry and is not shared with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-white text-lg font-medium mb-3">Contact</h2>
              <p>
                If you have questions about this privacy policy, please{" "}
                <Link href="/#contact" className="text-white underline underline-offset-2 hover:text-slate-300">
                  contact me
                </Link>
                .
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
