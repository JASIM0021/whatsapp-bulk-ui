import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/#features', label: 'Features' },
    { to: '/#pricing', label: 'Pricing' },
    { to: '/docs', label: 'API Docs' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (to: string) => location.pathname === to;

  const scrollToSection = (hash: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') return; // Link component handles navigation
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/icon-192.png" alt="WhatsApp Bulk Messenger" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-lg font-bold text-white tracking-tight">
              Bulk<span className="text-green-400">Send</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.to.includes('#') ? (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => scrollToSection(link.to.split('#')[1] ? `#${link.to.split('#')[1]}` : '')}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive(link.to)
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-white/5"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => {
                if (link.to.includes('#')) scrollToSection(`#${link.to.split('#')[1]}`);
                else setMobileOpen(false);
              }}
              className="block px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-800 space-y-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/icon-192.png" alt="WhatsApp Bulk Messenger" className="w-9 h-9 rounded-xl object-contain" />
              <span className="text-lg font-bold text-white tracking-tight">
                Bulk<span className="text-green-400">Send</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              The fastest way to reach your customers on WhatsApp. Built for teams who value efficiency.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link to="/#features" className="text-sm hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/#pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/#how-it-works" className="text-sm hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/docs" className="text-sm hover:text-white transition-colors">API Documentation</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund" className="text-sm hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Get started */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">Get Started</h4>
            <p className="text-sm text-gray-500 mb-4">Start sending bulk messages in under 2 minutes.</p>
            <Link
              to="/login"
              className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} BulkSend. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</Link>
            <Link to="/refund" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
