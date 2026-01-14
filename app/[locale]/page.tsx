import { Link } from '@/navigation'
import { ArrowRight, Play, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageCompareSlider } from '@/components/ImageCompareSlider'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Footer } from '@/components/Footer'
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

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-blue-600">{t('heroTitle')}</span>
                <br />
                <span className="text-gray-900">{t('heroSubtitle')}</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                {t('heroDescription')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Link href="/enhance">
                  <Button size="lg" className="gap-2 px-6">
                    {t('ctaTryFree')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  {t('ctaWatchDemo')}
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-8">{t('noAccount')}</p>

              {/* Trust Badges */}
              <div className="text-sm text-gray-500">
                <span className="font-medium">{t('trustedBy')}</span>
                <div className="flex items-center gap-6 mt-3 opacity-60">
                  <span className="font-semibold text-gray-700">OnTheMarket</span>
                  <span className="font-semibold text-gray-700">MADE</span>
                  <span className="font-semibold text-gray-700">CoreLogic</span>
                  <span className="font-semibold text-gray-700">DCTR</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Image Slider */}
            <div className="order-1 lg:order-2">
              <div className="relative rounded-t-xl rounded-b-none overflow-hidden shadow-2xl">
                <ImageCompareSlider
                  beforeImage="/landing/hero images/wb-before.jpg"
                  afterImage="/landing/hero images/wb-after.jpg"
                  className=""
                />
                {/* Full-width testimonial overlay bar */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/20 backdrop-blur-xl px-6 py-2 flex items-center justify-center gap-4">
                  {/* Overlapping avatars */}
                  <div className="flex items-center -space-x-2.5">
                    <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200 ring-1 ring-gray-200">
                      <Image
                        src="/testimonials/Gemini_Generated_Image_339lzr339lzr339l.png"
                        alt="User"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200 ring-1 ring-gray-200">
                      <Image
                        src="/testimonials/Gemini_Generated_Image_job9rjob9rjob9rj.png"
                        alt="User"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200 ring-1 ring-gray-200">
                      <Image
                        src="/testimonials/Gemini_Generated_Image_l0v0vll0v0vll0v0.png"
                        alt="User"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  {/* Text */}
                  <span className="text-sm font-medium text-gray-700">{t('usedBy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-white">
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
      <section className="px-4 py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('comparisonTitle')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('comparisonSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Aurix Edit */}
            <div className="relative">
              <div className="absolute top-4 left-4 bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-md z-10">
                {t('aurixLabel')}
              </div>
              <ImageCompareSlider
                beforeImage="/landing/aurix edit/original-edit.jpg"
                afterImage="/landing/aurix edit/aurix-edit.jpg"
                className="rounded-xl"
              />
            </div>

            {/* Human Editor */}
            <div className="relative">
              <div className="absolute top-4 left-4 bg-gray-600 text-white text-sm font-medium px-3 py-1 rounded-md z-10">
                {t('humanLabel')}
              </div>
              <ImageCompareSlider
                beforeImage="/landing/human edit/original-edit.jpg"
                afterImage="/landing/human edit/human-edit.jpg"
                className="rounded-xl"
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
