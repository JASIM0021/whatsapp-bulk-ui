import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Loader2, X, Variable, BookOpen, Check, Eye } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface EmailTemplate { id: string; name: string; category: string; subject: string; bodyHtml: string; variables: string[]; createdAt: string }
interface PredefTemplate { name: string; category: string; subject: string; bodyHtml: string; variables: string[] }

/* ─── Predefined Templates ─── */
const PREDEFINED_TEMPLATES: PredefTemplate[] = [
  {
    name: 'Welcome Email',
    category: 'Transactional',
    subject: 'Welcome to {{company_name}}, {{name}}! 🎉',
    variables: ['name', 'company_name', 'cta_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:40px 32px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700">Welcome aboard! 🎉</h1>
    <p style="color:#bfdbfe;margin:8px 0 0;font-size:16px">We're thrilled to have you</p>
  </div>
  <div style="padding:36px 32px;background:#f8faff;border-radius:0 0 12px 12px">
    <h2 style="color:#1e3a8a;font-size:22px;margin:0 0 12px">Hi {{name}},</h2>
    <p style="color:#374151;line-height:1.7;margin:0 0 20px">Thank you for joining <strong>{{company_name}}</strong>! Your account is ready and you can start right away.</p>
    <div style="background:#fff;border:1px solid #e0e7ff;border-radius:10px;padding:24px;margin:24px 0">
      <p style="color:#374151;margin:0 0 8px;font-weight:600">✅ Account created</p>
      <p style="color:#374151;margin:0 0 8px;font-weight:600">✅ Email verified</p>
      <p style="color:#374151;margin:0;font-weight:600">✅ Ready to go</p>
    </div>
    <a href="{{cta_link}}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Get Started →</a>
    <p style="color:#6b7280;font-size:13px;margin:28px 0 0">Need help? Just reply to this email — we're here for you.</p>
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Monthly Newsletter',
    category: 'Newsletter',
    subject: '{{month}} Newsletter — What\'s new at {{company_name}}',
    variables: ['name', 'company_name', 'month', 'headline', 'summary', 'article_link'],
    bodyHtml: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#111827;padding:28px 32px;text-align:center">
    <p style="color:#9ca3af;font-size:12px;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase">{{company_name}}</p>
    <h1 style="color:#fff;margin:0;font-size:24px">{{month}} Newsletter</h1>
  </div>
  <div style="padding:36px 32px">
    <p style="color:#374151;font-size:15px;margin:0 0 24px">Hello {{name}},</p>
    <h2 style="color:#111827;font-size:22px;border-left:4px solid #2563eb;padding-left:16px;margin:0 0 16px">{{headline}}</h2>
    <p style="color:#4b5563;line-height:1.8;margin:0 0 24px">{{summary}}</p>
    <a href="{{article_link}}" style="display:inline-block;border:2px solid #2563eb;color:#2563eb;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">Read more →</a>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:36px 0"/>
    <p style="color:#9ca3af;font-size:12px;text-align:center">You're receiving this because you subscribed to {{company_name}} updates.<br/>Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Flash Sale',
    category: 'Promotional',
    subject: '⚡ {{discount}}% OFF — Ends in 24 hours!',
    variables: ['name', 'company_name', 'discount', 'promo_code', 'shop_link', 'expiry_date'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#dc2626;padding:12px;text-align:center">
    <p style="color:#fff;margin:0;font-size:13px;font-weight:600;letter-spacing:1px">⏰ LIMITED TIME OFFER — ENDS {{expiry_date}}</p>
  </div>
  <div style="background:#fff3f3;padding:40px 32px;text-align:center">
    <p style="color:#dc2626;font-size:14px;font-weight:700;letter-spacing:2px;margin:0 0 8px">FLASH SALE</p>
    <h1 style="color:#111827;font-size:52px;font-weight:900;margin:0;line-height:1">{{discount}}% OFF</h1>
    <p style="color:#6b7280;margin:8px 0 24px;font-size:15px">Hi {{name}}, this is your exclusive deal</p>
    <div style="background:#fff;border:2px dashed #dc2626;border-radius:10px;padding:20px 32px;display:inline-block;margin:0 0 28px">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">Use code</p>
      <p style="color:#dc2626;font-size:28px;font-weight:900;margin:0;letter-spacing:4px;font-family:monospace">{{promo_code}}</p>
    </div>
    <br/>
    <a href="{{shop_link}}" style="display:inline-block;background:#dc2626;color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Shop Now →</a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Order Confirmation',
    category: 'Transactional',
    subject: 'Order #{{order_id}} confirmed ✅',
    variables: ['name', 'company_name', 'order_id', 'product_name', 'amount', 'delivery_date', 'track_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#16a34a;padding:32px;text-align:center;border-radius:12px 12px 0 0">
    <div style="width:56px;height:56px;background:#fff;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:26px">✅</div>
    <h1 style="color:#fff;margin:0;font-size:22px">Order Confirmed!</h1>
    <p style="color:#bbf7d0;margin:6px 0 0;font-size:14px">Order #{{order_id}}</p>
  </div>
  <div style="padding:32px;background:#f0fdf4">
    <p style="color:#374151;margin:0 0 20px">Hi {{name}}, your order has been received and is being processed.</p>
    <div style="background:#fff;border:1px solid #d1fae5;border-radius:10px;padding:20px;margin:0 0 20px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="color:#6b7280;font-size:13px;padding:6px 0">Product</td><td style="color:#111827;font-weight:600;text-align:right;font-size:13px">{{product_name}}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding:6px 0">Order ID</td><td style="color:#111827;text-align:right;font-size:13px">{{order_id}}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding:6px 0">Total</td><td style="color:#16a34a;font-weight:700;text-align:right;font-size:16px">{{amount}}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding:6px 0">Est. Delivery</td><td style="color:#111827;text-align:right;font-size:13px">{{delivery_date}}</td></tr>
      </table>
    </div>
    <a href="{{track_link}}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Track Order →</a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">© {{company_name}}</p>
  </div>
</div>`,
  },
  {
    name: 'Password Reset',
    category: 'Transactional',
    subject: 'Reset your {{company_name}} password',
    variables: ['name', 'company_name', 'reset_link', 'expiry_minutes'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#f8faff;padding:36px 32px;text-align:center;border-bottom:1px solid #e0e7ff">
    <div style="font-size:40px;margin:0 0 12px">🔒</div>
    <h1 style="color:#1e3a8a;margin:0;font-size:22px">Reset Your Password</h1>
  </div>
  <div style="padding:32px">
    <p style="color:#374151;margin:0 0 16px">Hi {{name}},</p>
    <p style="color:#374151;line-height:1.7;margin:0 0 24px">We received a request to reset the password for your <strong>{{company_name}}</strong> account. Click the button below to choose a new password.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="{{reset_link}}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Reset Password</a>
    </div>
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:20px 0">
      <p style="color:#92400e;margin:0;font-size:13px">⚠️ This link expires in <strong>{{expiry_minutes}} minutes</strong>. If you didn't request this, please ignore this email.</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">© {{company_name}}</p>
  </div>
</div>`,
  },
  {
    name: 'Abandoned Cart',
    category: 'Marketing',
    subject: '{{name}}, you left something behind 🛒',
    variables: ['name', 'company_name', 'product_name', 'product_image_url', 'cart_link', 'discount_offer'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#1f2937;padding:24px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">{{company_name}}</h1>
  </div>
  <div style="padding:36px 32px;text-align:center">
    <div style="font-size:48px;margin:0 0 16px">🛒</div>
    <h2 style="color:#111827;font-size:22px;margin:0 0 8px">Oops! You left something behind</h2>
    <p style="color:#6b7280;margin:0 0 28px">Hi {{name}}, your cart misses you!</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:0 0 24px;text-align:left">
      <p style="color:#374151;font-weight:600;margin:0 0 4px">{{product_name}}</p>
      <p style="color:#6b7280;font-size:13px;margin:0">Saved in your cart</p>
    </div>
    {{#if discount_offer}}
    <div style="background:#fef3c7;border-radius:8px;padding:14px;margin:0 0 24px">
      <p style="color:#92400e;font-weight:600;margin:0">🎁 {{discount_offer}} — just for you!</p>
    </div>
    {{/if}}
    <a href="{{cart_link}}" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Complete Purchase →</a>
    <p style="color:#9ca3af;font-size:12px;margin:28px 0 0">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Feedback Request',
    category: 'Follow-up',
    subject: 'How was your experience, {{name}}? ⭐',
    variables: ['name', 'company_name', 'product_name', 'review_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#7c3aed;padding:36px 32px;text-align:center;border-radius:12px 12px 0 0">
    <div style="font-size:44px;margin:0 0 8px">⭐</div>
    <h1 style="color:#fff;margin:0;font-size:22px">Share Your Experience</h1>
  </div>
  <div style="padding:32px;background:#faf5ff;border-radius:0 0 12px 12px">
    <p style="color:#374151;margin:0 0 16px">Hi {{name}},</p>
    <p style="color:#374151;line-height:1.7;margin:0 0 24px">We hope you're loving <strong>{{product_name}}</strong>! Your feedback means everything to us and helps other customers make better choices.</p>
    <p style="color:#374151;font-weight:600;margin:0 0 12px;text-align:center">How would you rate your experience?</p>
    <div style="text-align:center;margin:0 0 24px">
      <a href="{{review_link}}?rating=5" style="font-size:28px;text-decoration:none;margin:0 4px">⭐</a>
      <a href="{{review_link}}?rating=5" style="font-size:28px;text-decoration:none;margin:0 4px">⭐</a>
      <a href="{{review_link}}?rating=5" style="font-size:28px;text-decoration:none;margin:0 4px">⭐</a>
      <a href="{{review_link}}?rating=5" style="font-size:28px;text-decoration:none;margin:0 4px">⭐</a>
      <a href="{{review_link}}?rating=5" style="font-size:28px;text-decoration:none;margin:0 4px">⭐</a>
    </div>
    <div style="text-align:center">
      <a href="{{review_link}}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Write a Review</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:28px 0 0;text-align:center">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Event Invitation',
    category: 'Marketing',
    subject: '📅 You\'re invited: {{event_name}}',
    variables: ['name', 'company_name', 'event_name', 'event_date', 'event_time', 'event_location', 'rsvp_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:48px 32px;text-align:center;border-radius:12px 12px 0 0">
    <p style="color:#93c5fd;font-size:13px;font-weight:600;letter-spacing:2px;margin:0 0 12px;text-transform:uppercase">You're invited</p>
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700">{{event_name}}</h1>
  </div>
  <div style="padding:36px 32px">
    <p style="color:#374151;margin:0 0 24px">Dear {{name}},</p>
    <p style="color:#374151;line-height:1.7;margin:0 0 28px">We'd love for you to join us at this exclusive event hosted by <strong>{{company_name}}</strong>.</p>
    <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:20px 24px;margin:0 0 28px">
      <p style="color:#1e3a8a;margin:0 0 8px;font-size:14px"><strong>📅 Date:</strong> {{event_date}}</p>
      <p style="color:#1e3a8a;margin:0 0 8px;font-size:14px"><strong>🕐 Time:</strong> {{event_time}}</p>
      <p style="color:#1e3a8a;margin:0;font-size:14px"><strong>📍 Location:</strong> {{event_location}}</p>
    </div>
    <div style="text-align:center">
      <a href="{{rsvp_link}}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">RSVP Now →</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:28px 0 0;text-align:center">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Re-engagement',
    category: 'Marketing',
    subject: 'We miss you, {{name}} 💙',
    variables: ['name', 'company_name', 'last_seen_days', 'offer', 'cta_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#f0f9ff;padding:48px 32px;text-align:center;border-radius:12px 12px 0 0;border-bottom:1px solid #bae6fd">
    <div style="font-size:52px;margin:0 0 12px">💙</div>
    <h1 style="color:#0369a1;margin:0;font-size:24px">We miss you, {{name}}!</h1>
    <p style="color:#0ea5e9;margin:8px 0 0">It's been {{last_seen_days}} days since your last visit</p>
  </div>
  <div style="padding:36px 32px;text-align:center">
    <p style="color:#374151;line-height:1.7;margin:0 0 20px">A lot has changed at <strong>{{company_name}}</strong> since you've been away. We've been working hard to bring you new features, better experience, and more value.</p>
    {{#if offer}}
    <div style="background:#fef3c7;border-radius:10px;padding:20px;margin:0 0 24px">
      <p style="color:#92400e;font-size:16px;font-weight:700;margin:0">🎁 Special comeback offer: {{offer}}</p>
    </div>
    {{/if}}
    <a href="{{cta_link}}" style="display:inline-block;background:#0369a1;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Come Back →</a>
    <p style="color:#9ca3af;font-size:12px;margin:28px 0 0">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Thank You',
    category: 'Transactional',
    subject: 'Thank you, {{name}}! 🙏',
    variables: ['name', 'company_name', 'action', 'message', 'cta_label', 'cta_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#059669,#10b981);padding:44px 32px;text-align:center;border-radius:12px 12px 0 0">
    <div style="font-size:48px;margin:0 0 12px">🙏</div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Thank You, {{name}}!</h1>
  </div>
  <div style="padding:36px 32px;background:#f0fdf4;border-radius:0 0 12px 12px;text-align:center">
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px">We truly appreciate you for <strong>{{action}}</strong>. It means the world to us.</p>
    <p style="color:#4b5563;line-height:1.7;margin:0 0 28px">{{message}}</p>
    <a href="{{cta_link}}" style="display:inline-block;background:#059669;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">{{cta_label}}</a>
    <p style="color:#9ca3af;font-size:12px;margin:28px 0 0">With gratitude,<br/><strong>{{company_name}}</strong> Team</p>
  </div>
</div>`,
  },
  {
    name: 'Referral Program',
    category: 'Promotional',
    subject: 'Earn rewards! Share {{company_name}} with friends 🎁',
    variables: ['name', 'company_name', 'referral_code', 'reward_amount', 'referral_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:44px 32px;text-align:center;border-radius:12px 12px 0 0">
    <div style="font-size:44px;margin:0 0 12px">🎁</div>
    <h1 style="color:#fff;margin:0;font-size:24px">Share & Earn!</h1>
    <p style="color:#e9d5ff;margin:8px 0 0">Invite friends, earn {{reward_amount}} for each one</p>
  </div>
  <div style="padding:36px 32px;text-align:center">
    <p style="color:#374151;margin:0 0 24px">Hi {{name}}, as a valued member of <strong>{{company_name}}</strong>, you can now earn rewards by inviting friends.</p>
    <div style="background:#f5f3ff;border:2px dashed #a855f7;border-radius:10px;padding:24px;margin:0 0 28px">
      <p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Your referral code</p>
      <p style="color:#7c3aed;font-size:28px;font-weight:900;margin:0;letter-spacing:4px;font-family:monospace">{{referral_code}}</p>
    </div>
    <a href="{{referral_link}}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Invite Friends →</a>
    <p style="color:#9ca3af;font-size:12px;margin:28px 0 0">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
  {
    name: 'Product Launch',
    category: 'Marketing',
    subject: '🚀 Introducing {{product_name}} — Available now!',
    variables: ['name', 'company_name', 'product_name', 'product_tagline', 'feature1', 'feature2', 'feature3', 'cta_link'],
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#0f172a;padding:48px 32px;text-align:center;border-radius:12px 12px 0 0">
    <p style="color:#64748b;font-size:12px;font-weight:600;letter-spacing:3px;margin:0 0 16px;text-transform:uppercase">{{company_name}} · New Release</p>
    <div style="font-size:40px;margin:0 0 16px">🚀</div>
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800">{{product_name}}</h1>
    <p style="color:#94a3b8;margin:10px 0 0;font-size:15px">{{product_tagline}}</p>
  </div>
  <div style="padding:36px 32px">
    <p style="color:#374151;margin:0 0 24px">Hi {{name}}, we've been working on something special and it's finally here.</p>
    <p style="color:#111827;font-weight:700;margin:0 0 16px">What's new:</p>
    <div style="space-y:12px">
      <div style="display:flex;align-items:flex-start;margin:0 0 12px">
        <span style="color:#2563eb;font-weight:700;margin-right:10px;flex-shrink:0">→</span>
        <p style="color:#374151;margin:0">{{feature1}}</p>
      </div>
      <div style="display:flex;align-items:flex-start;margin:0 0 12px">
        <span style="color:#2563eb;font-weight:700;margin-right:10px;flex-shrink:0">→</span>
        <p style="color:#374151;margin:0">{{feature2}}</p>
      </div>
      <div style="display:flex;align-items:flex-start;margin:0 0 12px">
        <span style="color:#2563eb;font-weight:700;margin-right:10px;flex-shrink:0">→</span>
        <p style="color:#374151;margin:0">{{feature3}}</p>
      </div>
    </div>
    <div style="text-align:center;margin:32px 0 0">
      <a href="{{cta_link}}" style="display:inline-block;background:#2563eb;color:#fff;padding:15px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Explore {{product_name}} →</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:28px 0 0;text-align:center">© {{company_name}} · Unsubscribe</p>
  </div>
</div>`,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: 'bg-blue-50 text-blue-700',
  Transactional: 'bg-green-50 text-green-700',
  Newsletter: 'bg-purple-50 text-purple-700',
  Promotional: 'bg-orange-50 text-orange-700',
  'Follow-up': 'bg-pink-50 text-pink-700',
};

const DEFAULT_HTML = `<h2 style="color:#1e3a8a">Hello {{name}}!</h2>
<p style="color:#374151">Thank you for being with us.</p>
<p>{{custom_message}}</p>
<br/>
<p style="color:#6b7280;font-size:13px">Best regards,<br/>The Team</p>`;

export function EmailTemplatePage({ isPaid }: { isPaid: boolean }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [preview, setPreview] = useState<EmailTemplate | PredefTemplate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState<string | null>(null);
  const [seeded, setSeeded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', category: 'Marketing', subject: '', bodyHtml: DEFAULT_HTML, variables: '' });

  useEffect(() => { if (isPaid) load(); }, [isPaid]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.templates);
      const d = await r.json();
      if (d.success) {
        setTemplates(d.data || []);
        setSeeded(new Set((d.data || []).map((t: EmailTemplate) => t.name)));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim()) { alert('Name and subject required'); return; }
    setSaving(true);
    const vars = form.variables.split(',').map(v => v.trim()).filter(Boolean);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.templates, {
        method: 'POST',
        body: JSON.stringify({ name: form.name, category: form.category, subject: form.subject, bodyHtml: form.bodyHtml, variables: vars }),
      });
      const d = await r.json();
      if (d.success) {
        setTemplates(t => [d.data, ...t]);
        setSeeded(s => new Set([...s, form.name]));
        setShowForm(false);
        setForm({ name: '', category: 'Marketing', subject: '', bodyHtml: DEFAULT_HTML, variables: '' });
      } else alert(d.error);
    } catch { alert('Failed to save'); }
    setSaving(false);
  };

  const seedTemplate = async (tmpl: PredefTemplate) => {
    if (seeded.has(tmpl.name)) return;
    setSeeding(tmpl.name);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.templates, {
        method: 'POST',
        body: JSON.stringify(tmpl),
      });
      const d = await r.json();
      if (d.success) {
        setTemplates(t => [d.data, ...t]);
        setSeeded(s => new Set([...s, tmpl.name]));
      }
    } catch { /* ignore */ }
    setSeeding(null);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    setDeleting(id);
    try {
      await apiFetch(API_ENDPOINTS.email.deleteTemplate(id), { method: 'DELETE' });
      setTemplates(t => t.filter(tmpl => tmpl.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  if (!isPaid) return <div className="text-center py-16"><FileText size={40} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">Available on paid plans</p></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowLibrary(v => !v); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${showLibrary ? 'bg-violet-600 text-white border-violet-600' : 'border-violet-200 text-violet-700 hover:bg-violet-50'}`}>
            <BookOpen size={15} />
            Starter Library
          </button>
          <button onClick={() => { setShowForm(v => !v); setShowLibrary(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Cancel' : 'New Template'}
          </button>
        </div>
      </div>

      {/* Predefined Template Library */}
      {showLibrary && (
        <div className="bg-white rounded-xl border border-violet-200 overflow-hidden">
          <div className="px-5 py-4 bg-violet-50 border-b border-violet-200 flex items-center justify-between">
            <div>
              <p className="font-semibold text-violet-900">Starter Template Library</p>
              <p className="text-xs text-violet-600 mt-0.5">Click "Use Template" to save it to your library instantly</p>
            </div>
            <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">{PREDEFINED_TEMPLATES.length} templates</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {PREDEFINED_TEMPLATES.map(tmpl => {
              const alreadyAdded = seeded.has(tmpl.name);
              const isSeedingThis = seeding === tmpl.name;
              return (
                <div key={tmpl.name} className={`rounded-xl border p-4 transition-all ${alreadyAdded ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-violet-300 hover:shadow-sm'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{tmpl.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${CATEGORY_COLORS[tmpl.category] ?? 'bg-gray-100 text-gray-600'}`}>{tmpl.category}</span>
                    </div>
                    {alreadyAdded && <span className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><Check size={11} className="text-white" /></span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-3">{tmpl.subject}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPreview(tmpl)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye size={11} /> Preview
                    </button>
                    <button
                      onClick={() => seedTemplate(tmpl)}
                      disabled={alreadyAdded || isSeedingThis}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        alreadyAdded
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {isSeedingThis ? <Loader2 size={11} className="animate-spin" /> : alreadyAdded ? <Check size={11} /> : <Plus size={11} />}
                      {alreadyAdded ? 'Added' : isSeedingThis ? 'Adding…' : 'Use Template'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Email Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Template Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Welcome Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {['Marketing', 'Transactional', 'Newsletter', 'Promotional', 'Follow-up'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject line"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-600">HTML Body</label>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Variable size={11} />Use {'{{name}}'}, {'{{custom_var}}'} etc.</span>
            </div>
            <textarea value={form.bodyHtml} onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))} rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Variables (comma-separated)</label>
            <input value={form.variables} onChange={e => setForm(f => ({ ...f, variables: e.target.value }))} placeholder="name, custom_message, link"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          {form.bodyHtml && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">{'Preview ({{name}} = "John")'}</div>
              <div className="p-4 text-sm" dangerouslySetInnerHTML={{ __html: form.bodyHtml.replace(/{{name}}/g, 'John') }} />
            </div>
          )}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-blue-500" /></div>
      ) : templates.length === 0 && !showForm && !showLibrary ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16 px-8">
          <FileText size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Create reusable HTML email templates with dynamic variables</p>
          <button onClick={() => setShowLibrary(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <BookOpen size={15} /> Browse Starter Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full font-medium ${CATEGORY_COLORS[t.category] ?? 'bg-indigo-50 text-indigo-700'}`}>{t.category}</span>
                </div>
                <button onClick={() => del(t.id)} disabled={deleting === t.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                  {deleting === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-2 truncate">{t.subject}</p>
              {t.variables?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {t.variables.map(v => <span key={v} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">{'{{'}{v}{'}}'}</span>)}
                </div>
              )}
              <button onClick={() => setPreview(t)}
                className="w-full mt-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors border border-blue-100">
                Preview HTML
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">{'name' in preview ? preview.name : (preview as EmailTemplate).name}</p>
                <p className="text-xs text-gray-500">Subject: {preview.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                {'id' in preview ? null : (
                  <button
                    onClick={() => { seedTemplate(preview as PredefTemplate); setPreview(null); }}
                    disabled={seeded.has(preview.name) || seeding === preview.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {seeded.has(preview.name) ? <><Check size={12} /> Added</> : <><Plus size={12} /> Use Template</>}
                  </button>
                )}
                <button onClick={() => setPreview(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: preview.bodyHtml.replace(/{{name}}/g, 'John').replace(/{{company_name}}/g, 'Acme Inc') }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
