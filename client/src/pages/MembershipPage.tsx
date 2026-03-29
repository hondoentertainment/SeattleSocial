import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Star,
  Zap,
  Sparkles,
} from 'lucide-react';
import { getMembershipTier, setMembershipTier } from '../utils/storage';
import type { MembershipTier } from '../types';

interface PlanConfig {
  tier: MembershipTier;
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  features: string[];
  highlighted: boolean;
  gradient: string;
  buttonText: string;
}

const plans: PlanConfig[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started discovering Seattle events.',
    icon: <Star className="w-6 h-6" />,
    features: [
      'Browse all events',
      'FOMO Score visibility',
      'Save up to 10 events',
      'Basic notifications',
    ],
    highlighted: false,
    gradient: 'from-gray-50 to-gray-100',
    buttonText: 'Current Plan',
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: 9.99,
    description: 'The full Seattle Social experience.',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Everything in Free',
      'Unlimited saved events',
      'Early access to high-demand events (24hr head start)',
      '"Friends Going" visibility',
      'Priority booking',
      'Ad-free experience',
    ],
    highlighted: true,
    gradient: 'from-primary-50 to-primary-100',
    buttonText: 'Upgrade to Premium',
  },
  {
    tier: 'premium-plus',
    name: 'Premium+',
    price: 19.99,
    description: 'The ultimate VIP experience.',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Everything in Premium',
      'VIP event access',
      'Exclusive events',
      'Personal event concierge',
      'Premium badge on profile',
      'Priority customer support',
    ],
    highlighted: false,
    gradient: 'from-amber-50 to-yellow-100',
    buttonText: 'Go Premium Plus',
  },
];

const comparisonFeatures = [
  { name: 'Browse events', free: true, premium: true, premiumPlus: true },
  { name: 'FOMO Score', free: true, premium: true, premiumPlus: true },
  { name: 'Save events', free: 'Up to 10', premium: 'Unlimited', premiumPlus: 'Unlimited' },
  { name: 'Notifications', free: 'Basic', premium: 'Priority', premiumPlus: 'Priority' },
  { name: 'Early access (24hr)', free: false, premium: true, premiumPlus: true },
  { name: 'Friends Going', free: false, premium: true, premiumPlus: true },
  { name: 'Priority booking', free: false, premium: true, premiumPlus: true },
  { name: 'Ad-free', free: false, premium: true, premiumPlus: true },
  { name: 'VIP event access', free: false, premium: false, premiumPlus: true },
  { name: 'Exclusive events', free: false, premium: false, premiumPlus: true },
  { name: 'Event concierge', free: false, premium: false, premiumPlus: true },
  { name: 'Premium badge', free: false, premium: false, premiumPlus: true },
  { name: 'Priority support', free: false, premium: false, premiumPlus: true },
];

const faqItems = [
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes! You can cancel your subscription at any time from your account settings. Your premium benefits will remain active until the end of your current billing period.',
  },
  {
    question: 'What does "early access" mean?',
    answer:
      'Premium members get a 24-hour head start to book high-demand events before they go on sale to the general public. This means you can secure your spot before events sell out.',
  },
  {
    question: 'How does the personal event concierge work?',
    answer:
      'Premium+ members get access to a dedicated concierge who can help you find events matching your preferences, handle group bookings, and arrange VIP experiences.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Absolutely. You can change your plan at any time. If you upgrade, you will get immediate access to new features. If you downgrade, changes take effect at the end of your billing period.',
  },
  {
    question: 'Is there a free trial for Premium?',
    answer:
      'We offer a 7-day free trial for new Premium subscribers. You can explore all premium features before deciding to commit.',
  },
];

export default function MembershipPage() {
  const [currentTier, setCurrentTier] = useState<MembershipTier>(getMembershipTier());
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [processing, setProcessing] = useState<MembershipTier | null>(null);

  const tierRank: Record<MembershipTier, number> = {
    free: 0,
    premium: 1,
    'premium-plus': 2,
  };

  const handleSelectPlan = (tier: MembershipTier) => {
    if (tier === currentTier) return;
    setProcessing(tier);
    // Simulate upgrade/downgrade
    setTimeout(() => {
      setMembershipTier(tier);
      setCurrentTier(tier);
      setProcessing(null);
    }, 1000);
  };

  const getButtonText = (plan: PlanConfig): string => {
    if (plan.tier === currentTier) return 'Current Plan';
    if (tierRank[plan.tier] > tierRank[currentTier]) return plan.buttonText;
    return 'Downgrade';
  };

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-sm text-gray-700">{value}</span>;
    }
    return value ? (
      <Check className="w-5 h-5 text-green-600 mx-auto" />
    ) : (
      <span className="text-gray-300 text-center block">-</span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Link to="/" className="inline-flex items-center text-primary-200 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to events
          </Link>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Unlock the Full Seattle Social Experience
            </h1>
          </div>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Choose the plan that fits your lifestyle. Upgrade anytime, cancel anytime.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const isCurrent = plan.tier === currentTier;
            const isProcessing = processing === plan.tier;

            return (
              <div
                key={plan.tier}
                className={`relative bg-white rounded-2xl shadow-xl p-8 flex flex-col ${
                  plan.highlighted ? 'ring-2 ring-primary-500 scale-[1.02]' : ''
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.highlighted && !isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Current Plan
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 ${
                  plan.tier === 'premium-plus' ? 'text-amber-600' : plan.tier === 'premium' ? 'text-primary-600' : 'text-gray-600'
                }`}>
                  {plan.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price.toFixed(2)}
                  </span>
                  <span className="text-gray-500">/mo</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.tier)}
                  disabled={isCurrent || isProcessing}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-500 cursor-default'
                      : plan.highlighted
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${isProcessing ? 'opacity-70' : ''}`}
                >
                  {isProcessing ? 'Processing...' : getButtonText(plan)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Compare Plans
        </h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-gray-600">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-primary-600">
                    Premium
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-amber-600">
                    Premium+
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr
                    key={row.name}
                    className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="py-3 px-6 text-sm text-gray-900 font-medium">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderCell(row.free)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderCell(row.premium)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderCell(row.premiumPlus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-gray-900">{item.question}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
