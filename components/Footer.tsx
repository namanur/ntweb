"use client";
import React from "react";
import { MapPin, Phone, Mail, ShieldCheck, Facebook, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    // ✅ UPDATED: bg-zinc-900 in dark mode gives that "light grey" contrast against black body
    <footer className="bg-zinc-100 dark:bg-zinc-900 border-t border-border pt-12 pb-8 mt-20 transition-colors">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Column 1: Brand & Trust */}
          <div>
            <h2 className="text-2xl font-black text-foreground mb-4 tracking-tight uppercase">
              NANDAN TRADERS
            </h2>
            <div className="flex items-center gap-2 text-sm text-foreground mb-4 bg-background border border-border p-2 rounded-sm w-fit font-mono">
              <ShieldCheck size={16} />
              <span>GST: 20AIIPM2082N1Z7</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
              Premium quality wholesale goods. Serving Hazaribagh with trust and reliability.
              <br />
              <span className="font-bold text-foreground mt-2 block opacity-80">
                Proprietor: Ram Nandan Mishra
              </span>
            </p>
          </div>

          {/* Column 2: Contact Info */}
          <div>
            <h3 className="font-bold text-foreground mb-4 uppercase text-sm tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
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
                  <a href="https://wa.me/919431394095" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition font-medium">
                    94313-94095 <span className="text-[11px] bg-green-100 text-green-800 px-1.5 rounded-sm">WhatsApp</span>
                  </a>
                  <a href="tel:6204188728" className="hover:text-foreground transition">62041-88728 (Call)</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0" />
                <a href="mailto:nandantrader1963@gmail.com" className="hover:text-foreground transition">
                  nandantrader1963@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-4 uppercase text-sm tracking-wider">Customer Service</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/about" className="hover:text-foreground hover:underline">About Us</a></li>
              <li><a href="/terms" className="hover:text-foreground hover:underline">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</a></li>
            </ul>
            <div className="mt-6 flex gap-4">
              <a href="https://wa.me/919431394095" className="p-2 bg-background border border-border rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors">
                <MessageCircle size={20} />
              </a>
              <div className="p-2 bg-background border border-border rounded-full text-foreground">
                <Facebook size={20} />
              </div>
              <div className="p-2 bg-background border border-border rounded-full text-foreground">
                <Instagram size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Nandan Traders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}