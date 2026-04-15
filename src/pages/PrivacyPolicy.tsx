import { useSEO } from '@/hooks/useSEO';

export function PrivacyPolicy() {
  useSEO({
    title: 'Privacy Policy - WhatsApp Bulk Messenger',
    description: 'Learn how we collect, use, and protect your personal information when you use WhatsApp Bulk Messenger.',
    url: 'https://bulksender.todayintech.in/privacy'
  });

  return (

    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-950 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: April 8, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              BulkSend ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our WhatsApp Bulk Messaging service ("Service"). Please read this policy carefully. By using the Service, you consent to the data practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Account Information:</strong> Email address, name, and encrypted password when you register.</li>
              <li><strong>Contact Data:</strong> Phone numbers and names you upload for messaging purposes. This data is processed temporarily and not stored permanently.</li>
              <li><strong>WhatsApp Session Data:</strong> Encrypted session tokens to maintain your WhatsApp connection. These are stored securely and deleted upon disconnection.</li>
              <li><strong>Usage Data:</strong> Message delivery statistics, login timestamps, and feature usage for service improvement.</li>
              <li><strong>Uploaded Media:</strong> Images you upload for message attachments are temporarily stored and automatically deleted after sending.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>To provide and maintain the Service</li>
              <li>To authenticate your identity and manage your account</li>
              <li>To process and deliver your WhatsApp messages</li>
              <li>To improve and optimize the Service</li>
              <li>To communicate with you about service updates</li>
              <li>To detect, prevent, and address technical issues or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Storage & Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your data. WhatsApp session data is encrypted at rest and in transit. Contact data uploaded for messaging is processed in memory and not permanently stored on our servers. Uploaded images are automatically deleted after message delivery is complete. We use MongoDB with encryption for persistent data and secure HTTPS connections for all communications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. Your contact lists and message content are never shared with anyone. We may share anonymized, aggregate data for analytics purposes. We may disclose information if required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              Account data is retained as long as your account is active. WhatsApp session data is deleted when you disconnect or log out. Uploaded contacts and media are processed temporarily and not retained after message delivery. You may request deletion of your account and all associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent at any time</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use local storage (not cookies) to maintain your authentication session. No third-party tracking cookies are used. We do not use any advertising or analytics tracking services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Our Service is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:contact@todayintech.in" className="text-green-600 hover:underline">contact@todayintech.in</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
