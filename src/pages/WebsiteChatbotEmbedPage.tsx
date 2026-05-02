import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS, API_BASE_URL } from '@/config/api';
import { ArrowLeft, Copy, Check } from 'lucide-react';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative group">
      <pre className="bg-gray-950 text-green-400 rounded-xl p-4 text-sm overflow-x-auto font-mono whitespace-pre-wrap">{code}</pre>
      <button onClick={copy} className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export function WebsiteChatbotEmbedPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('YOUR_API_KEY');
  const [tab, setTab] = useState<'html' | 'react' | 'nextjs' | 'wordpress'>('html');

  useEffect(() => {
    apiFetch(API_ENDPOINTS.apiKeys.list).then(r => r.json()).then(d => {
      if (d.success && d.data?.length > 0) setApiKey(d.data[0].key);
    }).catch(() => {});
  }, []);

  const scriptSrc = `${API_BASE_URL}/api/website-chatbot/script?apikey=${apiKey}`;

  const snippets = {
    html: `<!-- Add before </body> -->
<script src="${scriptSrc}"></script>`,
    react: `// In your React app — e.g. src/App.tsx or layout component
import { useEffect } from 'react';

export default function Layout({ children }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${scriptSrc}';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  return <>{children}</>;
}`,
    nextjs: `// app/layout.tsx (Next.js 13+ App Router)
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${scriptSrc}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`,
    wordpress: `// Add to your WordPress theme's functions.php
function add_nexbotix_chatbot() {
  wp_enqueue_script(
    'nexbotix-chatbot',
    '${scriptSrc}',
    array(),
    null,
    true  // load in footer
  );
}
add_action('wp_enqueue_scripts', 'add_nexbotix_chatbot');`,
  };

  const platforms = [
    { id: 'html' as const, label: 'HTML' },
    { id: 'react' as const, label: 'React' },
    { id: 'nextjs' as const, label: 'Next.js' },
    { id: 'wordpress' as const, label: 'WordPress' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/website-chatbot')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Integration Guide</h1>
            <p className="text-xs text-gray-500">Embed the chatbot on your website</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* API Key status */}
        {apiKey === 'YOUR_API_KEY' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            ⚠️ No API key found. Go to <strong>Subscription → Developer API</strong> to generate one, then return here.
          </div>
        )}

        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">1</div>
            <h2 className="font-semibold text-gray-900">Configure your chatbot</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Go to the <button onClick={() => navigate('/website-chatbot')} className="text-green-600 hover:underline font-medium">Setup tab</button> to add your business info, customize the widget appearance, and set up lead capture.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p>✓ Add business name, description and services</p>
            <p>✓ Set primary color and widget position</p>
            <p>✓ Configure lead capture email/WhatsApp</p>
            <p>✓ Optionally whitelist allowed domains</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">2</div>
            <h2 className="font-semibold text-gray-900">Add the script to your website</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Choose your platform and paste the code snippet:</p>

          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            {platforms.map(p => (
              <button key={p.id} onClick={() => setTab(p.id)}
                className={`px-4 py-1.5 text-sm rounded-md transition-all font-medium ${tab === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {p.label}
              </button>
            ))}
          </div>

          <CodeBlock code={snippets[tab]} />
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">3</div>
            <h2 className="font-semibold text-gray-900">Test your chatbot</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">Once the script is added, the chatbot widget will appear automatically on your site. To test:</p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p>1. Open your website in a browser</p>
            <p>2. The chat icon appears in the {'{position}'} corner</p>
            <p>3. Click it to open the chat panel</p>
            <p>4. Ask a question about your business</p>
            <p>5. Leads appear in the <button onClick={() => navigate('/website-chatbot/leads')} className="text-green-600 hover:underline">Leads page</button></p>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Advanced: JavaScript API</h2>
          <p className="text-sm text-gray-600 mb-3">You can control the widget programmatically:</p>
          <CodeBlock code={`// Open / close the chat widget
window.NexBotix.open();
window.NexBotix.close();
window.NexBotix.toggle();

// Prefill user info (e.g. from your auth system)
window.NexBotix.setUser({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '919876543210'
});

// Listen for lead capture events
window.addEventListener('nexbotix:lead', (e) => {
  console.log('Lead captured:', e.detail);
});`} />
        </div>

      </div>
    </div>
  );
}
