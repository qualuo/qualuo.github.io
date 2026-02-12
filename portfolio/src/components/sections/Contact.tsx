"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Script from "next/script";
import Link from "next/link";

export function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forminit = new (window as any).Forminit();
      const { error } = await forminit.submit("ihnc3t6iqob", {
        blocks: [
          {
            type: "sender",
            properties: {
              fullName: formState.name,
              email: formState.email,
            },
          },
          {
            type: "text",
            name: "message",
            value: formState.message,
          },
        ],
      });

      if (error) {
        console.error("Form submission error:", error.message);
      } else {
        setIsSubmitted(true);
        setFormState({ name: "", email: "", message: "" });
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section id="contact" className="relative min-h-screen pt-32 lg:pt-48 pb-12 px-6 flex flex-col justify-center">
      <Script src="https://forminit.com/sdk/v1/forminit.js" strategy="lazyOnload" />
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Let&apos;s build
              <br />
              <span className="text-slate-500">something great.</span>
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed mb-12 max-w-md">
              Have a project in mind? I&apos;m always open to discussing new opportunities
              and ideas.
            </p>

            {/* Contact links */}
            <div className="space-y-6">
              <motion.a
                href="mailto:qualuo@gmail.com"
                className="group flex items-center gap-4"
                whileHover={{ x: 8 }}
                transition={{ duration: 0.2 }}
                data-cursor="pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-white group-hover:text-blue-400 transition-colors">qualuo@gmail.com</p>
                </div>
              </motion.a>

              <motion.a
                href="https://github.com/qualuo"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4"
                whileHover={{ x: 8 }}
                transition={{ duration: 0.2 }}
                data-cursor="pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">GitHub</p>
                  <p className="text-white group-hover:text-blue-400 transition-colors">github.com/qualuo</p>
                </div>
              </motion.a>

              {/* <motion.a
                href="https://linkedin.com/in/quang-luong"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4"
                whileHover={{ x: 8 }}
                transition={{ duration: 0.2 }}
                data-cursor="pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">LinkedIn</p>
                  <p className="text-white group-hover:text-blue-400 transition-colors">linkedin.com/in/quang-luong</p>
                </div>
              </motion.a> */}
            </div>
          </motion.div>

          {/* Right column - Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex items-center justify-center min-h-100"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-semibold mb-2">Message sent</h3>
                  <p className="text-slate-400">I&apos;ll get back to you soon.</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm text-slate-500 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formState.name}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    data-cursor="text"
                    className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/10 focus:border-white/30 focus:outline-none text-white text-lg transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-slate-500 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    data-cursor="text"
                    className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/10 focus:border-white/30 focus:outline-none text-white text-lg transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm text-slate-500 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    required
                    aria-required="true"
                    rows={4}
                    data-cursor="text"
                    className="w-full px-0 py-4 bg-transparent border-0 border-b border-white/10 focus:border-white/30 focus:outline-none text-white text-lg transition-colors resize-none"
                    placeholder="Tell me about your project..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  data-cursor={isSubmitting ? "loading" : "pointer"}
                  className="w-full py-4 px-8 mt-8 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm"
        >
          <p>&copy; {new Date().getFullYear()} Quang Luong</p>
          <nav aria-label="Footer navigation" className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex gap-6">
              <Link href="/demos" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                Demos
              </Link>
              <Link href="/work" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                Work
              </Link>
              <Link href="/points" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                Points
              </Link>
              <Link href="/rfcs" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                RFCs
              </Link>
            </div>
            <span className="hidden md:block text-slate-600">·</span>
            <div className="flex gap-6 text-slate-600">
              <Link href="/colophon" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                60°N
              </Link>
              <Link href="/creative" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                Creative
              </Link>
              <Link href="/blob" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                Blob
              </Link>
            </div>
            <span className="hidden md:block text-slate-600">·</span>
            <div className="flex gap-6 text-slate-600">
              <Link href="/privacy" data-cursor="pointer" className="hover:text-slate-400 transition-colors">
                Privacy
              </Link>
            </div>
          </nav>
        </motion.footer>
      </div>
    </section>
  );
}
