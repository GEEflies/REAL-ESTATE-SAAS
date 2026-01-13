import { Link } from '@/navigation'
import { Sparkles, Eraser, Zap, Shield, Clock, ArrowRight, Aperture } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PricingCards } from '@/components/PricingCards'
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('Home')
  const tNav = useTranslations('Navbar')

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-yellow-50 animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>{t('heroBadge')}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            {t('heroTitlePrefix')}
            <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {t('heroTitleSuffix')}
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/enhance">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8">
                <Sparkles className="w-5 h-5" />
                {t('ctaEnhance')}
              </Button>
            </Link>
            <Link href="/remove">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-base px-8">
                <Eraser className="w-5 h-5" />
                {t('ctaRemove')}
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>{t('trustSecure')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{t('trustSpeed')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>{t('trustQuality')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Enhance Feature */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('featureEnhanceTitle')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('featureEnhanceDesc')}
              </p>
              <Link href="/enhance" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700">
                {t('featureEnhanceLink')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Remove Feature */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Eraser className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('featureRemoveTitle')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('featureRemoveDesc')}
              </p>
              <Link href="/remove" className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700">
                {t('featureRemoveLink')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('pricingTitle')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('pricingSubtitle')}
            </p>
          </div>

          <PricingCards />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Aperture className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Aurix</span>
            </div>
            <p className="text-sm text-center md:text-right">
              © {new Date().getFullYear()} Aurix. {t('footerRights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
