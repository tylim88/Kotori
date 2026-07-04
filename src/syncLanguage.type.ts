import { describe, it } from 'vitest'
import { kotori } from './kotori'
import { syncLanguage } from './syncLanguage'

const i18n = kotori({
	primary: 'en',
	secondaries: ['zh', 'ja'],
})

// ============================
// valid kotori instance
// ============================

describe('kotori instance', () => {
	it('accepts a valid kotori instance with sync storage', () => {
		syncLanguage(i18n, {
			get: () => 'en' as 'en' | 'zh' | 'ja' | null,
			set: (lang) => {},
		})
	})

	it('accepts a valid kotori instance with async storage', () => {
		syncLanguage(i18n, {
			get: async () => 'en' as 'en' | 'zh' | 'ja' | null,
			set: async (lang) => {},
		})
	})

	it('accepts mixed sync/async storage', () => {
		syncLanguage(i18n, {
			get: () => 'en' as 'en' | 'zh' | 'ja' | null,
			set: async (lang) => {},
		})
	})

	it('accepts undefined from get', () => {
		syncLanguage(i18n, {
			get: () => undefined,
			set: (lang) => {},
		})
	})
})

// ============================
// invalid setLanguage type
// ============================

describe('invalid setLanguage', () => {
	it('rejects setLanguage that accepts wider type than declared', () => {
		syncLanguage(
			{
				// @ts-expect-error setLanguage accepts string — wider than declared
				setLanguage: (lang: string) => {},
			},
			{
				get: () => 'en' as 'en' | null,
				set: (lang) => {},
			},
		)
	})

	it('rejects setLanguage that accepts narrower type than declared', () => {
		syncLanguage(
			{
				// @ts-expect-error setLanguage only accepts 'en' but secondaries includes 'zh'
				setLanguage: (lang: 'en') => {},
			},
			{
				get: () => 'en' as 'en' | null,
				set: (lang) => {},
			},
		)
	})

	it('rejects setLanguage with unrelated language type', () => {
		syncLanguage(
			{
				// @ts-expect-error 'fr' not declared
				setLanguage: (lang: 'en' | 'fr') => {},
			},
			{
				get: () => 'en' as 'en' | null,
				set: (lang) => {},
			},
		)
	})

	it('rejects invalid BCP47 tag', () => {
		syncLanguage(
			{
				// @ts-expect-error 'klingon' is not a valid BCP47 tag
				setLanguage: (lang: 'en' | 'klingon') => {},
			},
			{
				get: () => 'en' as 'en' | null,
				set: (lang) => {},
			},
		)
	})
})

// ============================
// invalid storage types
// ============================

describe('invalid storage', () => {
	it('rejects get returning wrong language type', () => {
		syncLanguage(i18n, {
			// @ts-expect-error 'fr' not declared in i18n
			get: () => 'fr' as 'fr' | null,
			set: (lang) => {},
		})
	})

	it('rejects set accepting wrong language type', () => {
		syncLanguage(i18n, {
			get: () => 'en' as 'en' | null,
			// @ts-expect-error 'fr' not declared in i18n
			set: (lang: 'fr') => {},
		})
	})
})
