'use client'

import { Link } from '@/navigation'
import { ArrowRight, Play, Star, StarHalf, Zap, ShieldCheck, TrendingDown } from 'lucide-react'
import { AnimatedZap, AnimatedShield, AnimatedTrend } from '@/components/HeroIcons'
import { Button } from '@/components/ui/button'
import { ImageCompareSlider } from '@/components/ImageCompareSlider'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Footer } from '@/components/Footer'
import { HeroTitle } from '@/components/HeroTitle'
import { PreFooter } from '@/components/PreFooter'

export default function HomePage() {
  const t = useTranslations('Home')

  const features = [
    {
      key: 'hdr',
      before: '/landing/hdr merging/hdr-before.jpg',
      after: '/landing/hdr merging/hdr-after.jpeg',
    },
    {
      key: 'window',
      before: '/landing/window pulling/wp-before.jpg',
      after: '/landing/window pulling/wp-after.jpeg',
    },
    {
      key: 'sky',
      before: '/landing/sky replacement/sky-before.jpeg',
      after: '/landing/sky replacement/sky-after.jpeg',
    },
    {
      key: 'whiteBalance',
      before: '/landing/white balance/wb-before.jpg',
      after: '/landing/white balance/wb-after.jpeg',
    },
    {
      key: 'perspective',
      before: '/landing/perspective correction/prsp-before.jpeg',
      after: '/landing/perspective correction/prsp-after.jpeg',
    },
    {
      key: 'relighting',
      before: '/landing/relighting/religh-before.jpg',
      after: '/landing/relighting/religh-after.jpg',
    },
    {
      key: 'raw',
      before: '/landing/raw/raw-before.jpg',
      after: '/landing/raw/raw-after.jpg',
    },
    {
      key: 'privacy',
      before: '/landing/privacy/privacy-before.jpeg',
      after: '/landing/privacy/privacy-after.jpeg',
    },
    {
      key: 'colorCorrection',
      before: '/landing/color correction/cc-before.jpg',
      after: '/landing/color correction/cc-after.jpg',
    },
  ]

  // Custom smooth scroll for mobile performance
  const smoothScrollToFeatures = () => {
    const target = document.getElementById('features')
    if (!target) return

    // Detect mobile
    const isMobile = window.innerWidth < 768

    if (!isMobile) {
      // Use native smooth scroll on desktop
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    // Custom smooth scroll for mobile using RAF
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 80 // 80px offset for navbar
    const startPosition = window.pageYOffset
    const distance = targetPosition - startPosition
    const duration = 800 // milliseconds
    let start: number | null = null

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime
      const timeElapsed = currentTime - start
      const progress = Math.min(timeElapsed / duration, 1)

      // Easing function (easeInOutCubic)
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      window.scrollTo(0, startPosition + distance * ease)

      if (timeElapsed < duration) {
        requestAnimationFrame(animation)
      }
    }

    requestAnimationFrame(animation)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 py-8 md:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="order-2 lg:order-1 flex flex-col items-start text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {t('heroBadge')}
              </div>

              <HeroTitle />

              <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-lg leading-relaxed">
                {t.rich('heroDescription', {
                  br: () => <br />,
                  highlight: (chunks) => <span className="text-blue-600 font-semibold">{chunks}</span>
                })}
              </p>

              {/* MOBILE ONLY: Hero Image between subtitle and CTA */}
              <div className="block lg:hidden w-full mb-6">
                <div className="relative rounded-xl overflow-hidden shadow-xl">
                  <ImageCompareSlider
                    beforeImage="/landing/hero images/wb-before.jpg"
                    afterImage="/landing/hero images/wb-after.jpg"
                    className=""
                  />
                  {/* Mobile testimonial bar - super slim */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/30 backdrop-blur-sm px-3 py-1.5 flex items-center justify-center gap-2">
                    <div className="flex items-center -space-x-1.5">
                      <div className="w-6 h-6 rounded-full border border-white/30 overflow-hidden">
                        <Image src="/testimonials/Gemini_Generated_Image_339lzr339lzr339l.png" alt="User" width={160} height={160} className="w-full h-full object-cover" quality={100} />
                      </div>
                      <div className="w-6 h-6 rounded-full border border-white/30 overflow-hidden">
                        <Image src="/testimonials/Gemini_Generated_Image_job9rjob9rjob9rj.png" alt="User" width={160} height={160} className="w-full h-full object-cover" quality={100} />
                      </div>
                      <div className="w-6 h-6 rounded-full border border-white/30 overflow-hidden">
                        <Image src="/testimonials/Gemini_Generated_Image_l0v0vll0v0vll0v0.png" alt="User" width={160} height={160} className="w-full h-full object-cover" quality={100} />
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <div className="relative w-3 h-3">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <StarHalf className="w-3 h-3 text-yellow-500 fill-yellow-500 absolute top-0 left-0" />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-white/90 antialiased hidden sm:inline-block md:hidden">{t('usedByMobile')}</span>
                    <span className="text-[10px] font-medium text-white/90 antialiased sm:hidden max-w-[120px] truncate">{t('usedByMobile')}</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:flex-row sm:items-center sm:gap-4 sm:w-auto mb-6">
                <Link href="/enhance" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-11 sm:h-12 px-3 sm:px-8 text-sm sm:text-base gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer">
                    <span className="sm:hidden">{t('ctaTryFreeShort')}</span>
                    <span className="hidden sm:inline">{t('ctaTryFree')}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <button
                  onClick={smoothScrollToFeatures}
                  className="w-full h-11 sm:h-12 px-3 sm:px-6 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors border border-gray-200 hover:border-gray-300 rounded-md bg-white cursor-pointer text-sm sm:text-base"
                >
                  <span className="sm:hidden">{t('ctaSeeFeaturesShort')}</span>
                  <span className="hidden sm:inline">{t('ctaSeeFeatures')}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mb-8 flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                {t('noAccount')}
              </p>

              {/* Benefits Bar */}
              <div className="w-full pt-6 border-t border-gray-100 flex flex-wrap justify-center sm:grid sm:grid-cols-3 gap-x-6 gap-y-3 sm:gap-4">
                <div className="flex flex-col gap-1 items-center sm:items-start">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm md:text-base">
                    <AnimatedZap className="w-4 h-4 md:w-5 md:h-5" />
                    {t('heroBenefits.speed')}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-center sm:items-start">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm md:text-base">
                    <AnimatedShield className="w-4 h-4 md:w-5 md:h-5" />
                    {t('heroBenefits.privacy')}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-center sm:items-start">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm md:text-base">
                    <AnimatedTrend className="w-4 h-4 md:w-5 md:h-5" />
                    {t('heroBenefits.cost')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Hero Image Slider - DESKTOP ONLY */}
            <div className="hidden lg:block order-1 lg:order-2">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <ImageCompareSlider
                  beforeImage="/landing/hero images/wb-before.jpg"
                  afterImage="/landing/hero images/wb-after.jpg"
                  className=""
                />
                {/* Desktop testimonial overlay bar */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm border-t border-white/60 px-6 py-3 flex items-center justify-center gap-4">
                  <div className="flex items-center -space-x-2.5">
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-gray-200">
                      <Image src="/testimonials/Gemini_Generated_Image_339lzr339lzr339l.png" alt="User" width={160} height={160} className="w-full h-full object-cover" quality={100} />
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-gray-200">
                      <Image src="/testimonials/Gemini_Generated_Image_job9rjob9rjob9rj.png" alt="User" width={160} height={160} className="w-full h-full object-cover" quality={100} />
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-gray-200">
                      <Image src="/testimonials/Gemini_Generated_Image_l0v0vll0v0vll0v0.png" alt="User" width={160} height={160} className="w-full h-full object-cover" quality={100} />
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <div className="relative w-4 h-4">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <StarHalf className="w-4 h-4 text-yellow-500 fill-yellow-500 absolute top-0 left-0" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white">{t('usedBy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-20 px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.key} className="group">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <ImageCompareSlider
                    beforeImage={feature.before}
                    afterImage={feature.after}
                    className="aspect-[4/3]"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {t(`features.${feature.key}.title`)}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {t(`features.${feature.key}.description`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section: Aurix vs Human Editor */}
      <section className="px-4 py-24 sm:py-32 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight leading-tight text-balance max-w-5xl mx-auto">
              {t('comparisonTitle')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
              {t('comparisonSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Aurix Edit */}
            <div className="relative border border-white/10 shadow-2xl rounded-2xl overflow-hidden group">
              <div className="absolute top-6 left-6 bg-blue-600/90 backdrop-blur-md text-white text-sm font-semibold px-4 py-1.5 rounded-full z-10 shadow-lg">
                {t('aurixLabel')}
              </div>
              <ImageCompareSlider
                beforeImage="/landing/aurix edit/original-edit.jpg"
                afterImage="/landing/aurix edit/aurix-edit.jpg"
                className=""
              />
            </div>

            {/* Human Editor */}
            <div className="relative border border-white/10 shadow-2xl rounded-2xl overflow-hidden group">
              <div className="absolute top-6 left-6 bg-gray-700/90 backdrop-blur-md text-white text-sm font-semibold px-4 py-1.5 rounded-full z-10 shadow-lg">
                {t('humanLabel')}
              </div>
              <ImageCompareSlider
                beforeImage="/landing/human edit/original-edit.jpg"
                afterImage="/landing/human edit/human-edit.jpg"
                className=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      {/* Pre-Footer CTA */}
      <PreFooter />

      {/* Footer */}
      <Footer />
    </div>
  )
}
