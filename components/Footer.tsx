"use client";
import React from "react";
import { MapPin, Phone, Mail, ShieldCheck, Facebook, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pt-12 pb-8 mt-20 transition-colors">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Column 1: Brand & Trust */}
          <div>
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-400 mb-4 tracking-tight">
              NANDAN TRADERS
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 bg-gray-100 dark:bg-gray-900 p-2 rounded w-fit">
              <ShieldCheck size={16} className="text-green-600" />
              <span>GST: 20AIIPM2082N1Z7</span>
            </div>
            <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">
              Premium quality wholesale goods. Serving Hazaribagh with trust and reliability.
              <br />
              <span className="font-medium text-gray-700 dark:text-gray-300 mt-2 block">
                Proprietor: Ram Nandan Mishra
              </span>
            </p>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 mt-0.5" />
                <span>
                  Khapriyawan, Barkagaon Road,<br />
                  Hazaribagh, Jharkhand - 825302
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0" />
                <div className="flex flex-col">
                  {/* ✅ WhatsApp Link Added */}
                  <a href="https://wa.me/919431394095" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-600 transition font-medium">
                     94313-94095 <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">WhatsApp</span>
                  </a>
                  <a href="tel:6204188728" className="hover:text-blue-600 transition">62041-88728 (Call)</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0" />
                <a href="mailto:nandantrader1963@gmail.com" className="hover:text-blue-600 transition">
                  nandantrader1963@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/about" className="hover:text-blue-600 dark:hover:text-blue-400">About Us</a></li>
              <li><a href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</a></li>
            </ul>
            <div className="mt-6 flex gap-4">
              <a href="https://wa.me/919431394095" className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 hover:scale-110 transition">
                <MessageCircle size={20} />
              </a>
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                <Facebook size={20} />
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                <Instagram size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Nandan Traders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}