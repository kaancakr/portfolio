"use client";
import { motion } from "framer-motion";

export const ContactSection = () => {
  return (
    <section id="contact" className="py-20 bg-[#0d1f12] relative font-mono">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold text-[#50fa7b] mb-4">
            $ get_in_touch
          </h2>
          <p className="text-[#88c999] mb-12 max-w-xl mx-auto">
            Have a project in mind? My inbox is always open!
          </p>

          <div className="bg-[#1a2e21] rounded-xl p-8 shadow-xl border border-[#50fa7b]/20">
            <form className="space-y-6">
              <div>
                <input
                  type="email"
                  placeholder="// your_email@example.com"
                  className="w-full p-3 bg-[#0d1f12] rounded-lg text-[#c3e9d0] focus:outline-none focus:ring-2 focus:ring-[#50fa7b] placeholder-[#88c999]"
                />
              </div>
              <div>
                <textarea
                  placeholder="// your_message"
                  rows={5}
                  className="w-full p-3 bg-[#0d1f12] rounded-lg text-[#c3e9d0] focus:outline-none focus:ring-2 focus:ring-[#50fa7b] placeholder-[#88c999]"
                ></textarea>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="w-full py-3 bg-[#50fa7b] text-[#0d1f12] rounded-lg font-medium hover:bg-[#3ecf6a] transition-colors"
              >
                $ send_message
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
