import { Link } from 'react-router-dom';
import { Zap, Bot, CalendarClock, Shield, Users, ArrowRight } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 pt-16 pb-20 border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">Our Story</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            About BulkSend
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We built BulkSend because businesses deserve a smarter, simpler way to reach their customers on WhatsApp — without the complexity or the cost.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">Our Mission</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
              Turn every WhatsApp conversation into a growth opportunity
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              BulkSend started as a solution to a simple problem: business owners were spending hours manually sending the same message to hundreds of contacts. We knew there had to be a better way.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Today, BulkSend combines bulk messaging, AI-powered auto-replies, and intelligent scheduling into a single platform — so you can focus on growing your business, not copy-pasting messages.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '2,000+', label: 'Businesses served' },
              { value: '5M+', label: 'Messages sent' },
              { value: '99.9%', label: 'Uptime' },
              { value: '< 24h', label: 'Support response' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 text-center">
                <p className="text-3xl font-extrabold text-green-400 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What we offer */}
      <div className="bg-gray-900 border-t border-gray-800/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">What We Offer</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Everything in one platform
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: 'Bulk Messaging', desc: 'Send thousands of personalised messages in one click from CSV or Excel contact lists.' },
              { icon: Bot, title: 'AI WhatsApp Bot', desc: 'Automate replies, capture leads, and answer FAQs around the clock with our AI bot.' },
              { icon: CalendarClock, title: 'Smart Scheduling', desc: 'Schedule campaigns to send at peak times for maximum open rates.' },
              { icon: Shield, title: 'Secure & Reliable', desc: 'Per-user WhatsApp sessions with encrypted storage and built-in rate limiting.' },
              { icon: Users, title: 'Contact Management', desc: 'Organise, filter, and segment contacts with an intuitive contact book.' },
              { icon: Zap, title: 'Developer API', desc: 'Trigger OTP messages, order alerts, and automated workflows via REST API.' },
            ].map(item => (
              <div key={item.title} className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-6">
                <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <item.icon size={18} className="text-green-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">Our Values</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What drives us
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Simplicity first', desc: 'Powerful features should not come with a steep learning curve. We obsess over UX so you don\'t have to.' },
            { title: 'Customer obsessed', desc: 'Every feature we ship starts with a real customer need. Your feedback shapes our roadmap.' },
            { title: 'Transparent pricing', desc: 'No hidden fees, no surprises. Pay only for what you need, cancel any time.' },
          ].map(v => (
            <div key={v.title} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-7">
              <div className="w-2 h-2 rounded-full bg-green-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-2">{v.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-green-100 mb-8">
            Join 2,000+ businesses already using BulkSend to grow on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-bold text-green-700 bg-white rounded-2xl hover:bg-green-50 transition-all shadow-xl"
            >
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white border border-white/40 rounded-2xl hover:bg-white/10 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
