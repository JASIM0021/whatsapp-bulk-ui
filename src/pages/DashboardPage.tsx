import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Smartphone, Mail, Globe, LogOut, Shield, Crown, ChevronRight, User } from 'lucide-react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const services = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Marketing',
      description: 'Send bulk WhatsApp messages, schedule campaigns, and set up automated chatbot responses.',
      icon: <Smartphone size={32} className="text-green-600" />,
      bg: 'bg-green-50',
      border: 'border-green-100',
      hoverBorder: 'hover:border-green-300',
      iconBg: 'bg-green-100',
      path: '/whatsapp',
      dbId: 'whatsapp',
    },
    {
      id: 'email',
      title: 'Email Campaigns',
      description: 'Create and broadcast professional email marketing campaigns with custom HTML templates.',
      icon: <Mail size={32} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hoverBorder: 'hover:border-blue-300',
      iconBg: 'bg-blue-100',
      path: '/email',
      dbId: 'email',
    },
    {
      id: 'website-chatbot',
      title: 'Website Chatbot',
      description: 'Embed a smart AI-powered chat widget on your website to instantly answer questions and capture leads.',
      icon: <Globe size={32} className="text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      hoverBorder: 'hover:border-purple-300',
      iconBg: 'bg-purple-100',
      path: '/website-chatbot',
      dbId: 'chatbot',
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="NexBotix" className="w-9 h-9 rounded-xl object-contain shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">NexBotix</h1>
              <p className="text-xs font-medium text-gray-500 mt-1">Unified Workspace</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors shadow-sm border border-transparent hover:border-purple-200">
                <Shield size={18} />
              </button>
            )}
            <button onClick={() => navigate('/subscription')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shadow-sm">
              <Crown size={16} />
              <span className="text-sm font-semibold capitalize">{user?.subscription?.plan === 'free' ? 'Trial' : user?.subscription?.plan || 'Free'}</span>
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2 pl-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/security')}>
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-md">
                <User size={16} />
              </div>
              <span className="text-sm font-semibold text-gray-800 hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-gray-500 text-lg max-w-2xl">Select a service below to start managing your communications, running campaigns, and capturing leads.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => {
            const plan = user?.subscription?.plan || 'free';
            const isAllAccess = ['monthly', 'yearly', 'starter', 'starter_yearly', 'growth', 'growth_yearly', 'business', 'business_yearly', 'unlimited_monthly', 'unlimited_yearly'].includes(plan);
            const isLocked = !user?.subscription?.isActive || (plan === 'free' ? service.dbId !== 'whatsapp' : (!isAllAccess && !user.subscription.enabledServices?.includes(service.dbId)));
            return (
              <div 
                key={service.id}
                onClick={() => !isLocked && navigate(service.path)}
                className={`relative group bg-white rounded-2xl border-2 ${service.border} ${isLocked ? 'opacity-80' : `cursor-pointer ${service.hoverBorder}`} overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}
              >
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${service.iconBg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      {service.icon}
                    </div>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                        <Crown size={12} /> Premium
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">{service.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{service.description}</p>
                </div>
                
                <div className={`px-8 py-4 ${service.bg} border-t ${service.border} flex items-center justify-between`}>
                  <span className={`text-sm font-semibold ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                    {isLocked ? 'Upgrade to unlock' : 'Open Workspace'}
                  </span>
                  {!isLocked && (
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ChevronRight size={16} className="text-gray-700" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Quick Stats or Additional Info could go here */}
      </main>
    </div>
  );
}
