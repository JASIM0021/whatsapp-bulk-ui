import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const txnId = params.get('txnid');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-4">
          Your subscription has been activated. You can now enjoy all premium features.
        </p>
        {txnId && (
          <p className="text-xs text-gray-400 mb-6 font-mono">Transaction ID: {txnId}</p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/app')}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            View Subscription Details
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentFailure() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const txnId = params.get('txnid');
  const error = params.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-4">
          {error || 'Your payment could not be processed. Please try again.'}
        </p>
        {txnId && (
          <p className="text-xs text-gray-400 mb-6 font-mono">Transaction ID: {txnId}</p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/subscription')}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/app')}
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
