import 'server-only'
import type { Locale } from '@/lib/shopify/types'

const dictionaries = {
  ko: () => import('@/dictionaries/ko.json').then((m) => m.default),
  ja: () => import('@/dictionaries/ja.json').then((m) => m.default),
  en: () => import('@/dictionaries/en.json').then((m) => m.default),
}

export const hasLocale = (locale: string): locale is Locale => locale in dictionaries

export const getDictionary = (locale: Locale) => dictionaries[locale]()
