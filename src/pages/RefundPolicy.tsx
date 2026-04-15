import { useSEO } from '@/hooks/useSEO';

export function RefundPolicy() {
  useSEO({
    title: 'Refund Policy - WhatsApp Bulk Messenger',
    description: 'Read the refund policy for WhatsApp Bulk Messenger.',
    url: 'https://bulksender.todayintech.in/refund'
  });

  return (

    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-950 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">Refund Policy</h1>
          <p className="text-gray-400">Last updated: April 11, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Overview</h2>
            <p className="text-gray-600 leading-relaxed">
              At BulkSend, we want you to be completely satisfied with your subscription. This Refund Policy outlines the terms under which refunds are granted for paid subscription plans. Please read this policy carefully before making a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Free Trial</h2>
            <p className="text-gray-600 leading-relaxed">
              BulkSend offers a free trial of 5 bulk messages to all new users at no cost. No credit card is required for the free trial, and no charges will be made until you choose to upgrade to a paid plan. We encourage all users to fully test the Service during the free trial before purchasing a subscription.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Eligibility for Refunds</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              You may be eligible for a full refund if:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>You request a refund within <strong>7 days</strong> of your initial paid subscription purchase.</li>
              <li>You have not used more than <strong>5 messages</strong> on the paid plan since purchasing.</li>
              <li>The request is for your <strong>first-time purchase</strong> only (not renewal or plan upgrade).</li>
              <li>A technical issue caused by BulkSend prevented you from using the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Non-Refundable Situations</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Refunds will <strong>not</strong> be issued in the following cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Refund requests made after 7 days from the date of purchase.</li>
              <li>Subscription renewals (monthly or yearly auto-renewals).</li>
              <li>Partial refunds for unused days in a billing period.</li>
              <li>Accounts suspended or terminated due to violation of our Terms & Conditions.</li>
              <li>Issues arising from your WhatsApp account being banned or restricted by WhatsApp/Meta.</li>
              <li>Failure to use the Service — purchase of a subscription does not entitle you to a refund simply because you did not use it.</li>
              <li>Issues caused by your own internet connection, device, or WhatsApp account configuration.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. How to Request a Refund</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              To request a refund, please contact our support team at{' '}
              <a href="mailto:contact@todayintech.in" className="text-green-600 hover:underline">
                contact@todayintech.in
              </a>{' '}
              with the following information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Your registered email address</li>
              <li>Transaction ID or payment reference number</li>
              <li>Date of purchase</li>
              <li>Reason for the refund request</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              We will review your request and respond within <strong>3–5 business days</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Refund Processing</h2>
            <p className="text-gray-600 leading-relaxed">
              Approved refunds will be processed to your original payment method within <strong>7–10 business days</strong>, depending on your bank or payment provider. BulkSend uses PayU as its payment processor; refund timelines may vary based on PayU and your bank's processing time. We are not responsible for delays caused by your bank or payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Plan Downgrades & Cancellations</h2>
            <p className="text-gray-600 leading-relaxed">
              You may cancel your subscription at any time by contacting support. Cancellation stops future charges but does not entitle you to a refund for the current billing period. After cancellation, your account will retain paid access until the end of the current billing cycle, after which it will revert to the free tier.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Service Disruptions</h2>
            <p className="text-gray-600 leading-relaxed">
              In the event of a significant service outage or disruption caused solely by BulkSend's infrastructure (not WhatsApp or third-party providers), we may offer a pro-rated credit or extension of your subscription period at our discretion. We do not issue refunds for disruptions caused by WhatsApp, Meta Platforms, payment processors, or internet infrastructure outside our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              For refund requests or questions about this policy, contact us at{' '}
              <a href="mailto:contact@todayintech.in" className="text-green-600 hover:underline">
                contact@todayintech.in
              </a>
              . We aim to respond to all inquiries within 2 business days.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
