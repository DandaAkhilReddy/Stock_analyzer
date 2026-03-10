'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Zap, Users, TrendingUp } from 'lucide-react'

export default function WaitlistContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTier, setSelectedTier] = useState<string>('pro')
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  // Check for referral code in URL
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setReferralCode(ref)
    }
  }, [searchParams])

  const handleGoogleSuccess = async (user: {
    name: string
    email: string
    photoUrl: string
    uid: string
  }) => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          tier: selectedTier,
          referredBy: referralCode, // Include referral code if present
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If already on waitlist, show their position
        if (data.position && data.referralCode) {
          router.push(
            `/waitlist/success?name=${encodeURIComponent(user.name)}&position=${data.position}&referralCode=${data.referralCode}`
          )
          return
        }
        throw new Error(data.error || 'Failed to join waitlist')
      }

      // Redirect to success page with position and referral code
      router.push(
        `/waitlist/success?name=${encodeURIComponent(user.name)}&position=${data.position}&referralCode=${data.referralCode}`
      )
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const tiers = [
    { id: 'starter', name: 'Starter', price: '$29', description: 'Manual entry' },
    { id: 'pro', name: 'Pro', price: '$69', description: 'Apple HealthKit' },
    { id: 'elite', name: 'Elite', price: '$149', description: 'Whoop + HealthKit' },
    { id: 'platinum', name: 'Platinum', price: '$299', description: 'White glove service' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-bold mx-auto mb-4 shadow-2xl">
                RF
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Join the <span className="gradient-text">ReddyFit</span> Waitlist
            </h1>
            {referralCode && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block mb-4 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-full"
              >
                <p className="text-green-400 font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  You've been referred! Get instant priority positioning
                </p>
              </motion.div>
            )}
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Be among the first to experience AI-powered fitness tracking with Whoop, Apple HealthKit integration, and our revolutionary AI Agent Marketplace.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: Users, label: 'Waitlist Spots', value: 'Limited' },
                { icon: Sparkles, label: 'AI Agents', value: '500+' },
                { icon: Zap, label: 'Launch', value: 'Soon' },
                { icon: TrendingUp, label: 'Early Access', value: '50% Off' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="glass-effect rounded-xl p-4"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect rounded-3xl p-8 md:p-12 shadow-2xl"
          >
            {/* Tier Selection */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">Which tier interests you?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      selectedTier === tier.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg scale-105'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold mb-1">{tier.name}</div>
                    <div className="text-sm gradient-text font-semibold mb-1">{tier.price}/mo</div>
                    <div className="text-xs text-gray-400">{tier.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Early Access Benefits
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  '50% off first month',
                  'Priority support',
                  'Beta tester badge',
                  'AI Agent marketplace access',
                  'Exclusive Discord channel',
                  'Feature voting rights',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Sign-In */}
            <div className="mb-6">
              <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm mb-4"
              >
                {error}
              </motion.div>
            )}

            {/* Privacy Note */}
            <p className="text-center text-sm text-gray-500">
              By joining, you agree to receive launch updates via email.
              <br />
              We'll never spam you or share your data. Unsubscribe anytime.
            </p>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center"
          >
            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {[
                {
                  q: 'When will ReddyFit launch?',
                  a: 'We\'re targeting Q1 2025. Waitlist members will get early access before the public launch.',
                },
                {
                  q: 'Is this a commitment to purchase?',
                  a: 'No! Joining the waitlist is free with no obligation. You decide if you want to subscribe when we launch.',
                },
                {
                  q: 'What devices are supported?',
                  a: 'iOS app launching first with Whoop and Apple HealthKit integration. Android coming soon after.',
                },
                {
                  q: 'Can I cancel the 50% off discount?',
                  a: 'The early bird discount is valid for your first month only. After that, regular pricing applies.',
                },
              ].map((faq, index) => (
                <div key={index} className="glass-effect rounded-xl p-6">
                  <h4 className="font-semibold mb-2 text-purple-300">{faq.q}</h4>
                  <p className="text-sm text-gray-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
