'use client'

import { Link } from '@/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'

export function Footer() {
    const t = useTranslations('Footer')

    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative w-10 h-10">
                                <Image
                                    src="/aurix-logo.png"
                                    alt="Aurix Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-bold text-2xl text-gray-900">
                                Aurix
                            </span>
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                            {t('description')}
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Handy Links */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6">{t('handyLinks')}</h3>
                        <ul className="space-y-4">
                            <li><Link href="/" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.home')}</Link></li>
                            <li><Link href="/enhance" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.enhance')}</Link></li>
                            <li><Link href="/remove" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.remove')}</Link></li>
                            <li><Link href="/#pricing" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.pricing')}</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.status')}</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6">{t('company')}</h3>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.about')}</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.blog')}</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.jobs')}</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.affiliate')}</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.privacy')}</Link></li>
                            <li><Link href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('links.terms')}</Link></li>
                        </ul>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6">{t('features')}</h3>
                        <ul className="space-y-4">
                            <li><Link href="/feature/sky-replacement" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('featureList.sky')}</Link></li>
                            <li><Link href="/feature/perspective-correction" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('featureList.perspective')}</Link></li>
                            <li><Link href="/feature/hdr-merge" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('featureList.hdr')}</Link></li>
                            <li><Link href="/feature/window-pulling" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('featureList.window')}</Link></li>
                            <li><Link href="/feature/white-balance" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('featureList.whiteBalance')}</Link></li>
                            <li><Link href="/feature/image-relighting" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">{t('featureList.relighting')}</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        © {currentYear} Aurix. {t('rights')}
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">A</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
