import { describe, it } from 'vitest'
import { detectLanguage, kotori } from './index'

const i18n = kotori({
	primary: 'en',
	secondaries: ['zh', 'ja'],
})

// ============================
// valid kotori instance
// ============================

describe('kotori instance', () => {
	it('accepts a valid kotori instance', () => {
		detectLanguage(i18n)
	})

	it('accepts a valid kotori instance with options', () => {
		detectLanguage(i18n, { fallbackToSubtag: true })
		detectLanguage(i18n, { fallbackToSubtag: false })
	})
})

// ============================
// custom instance — valid
// ============================

describe('custom instance — valid', () => {
	it('accepts a custom instance where setLanguage matches primary + secondaries', () => {
		detectLanguage({
			setLanguage: (lang: 'en' | 'zh' | 'ja') => {},
			config: { primary: 'en', secondaries: ['zh', 'ja'] },
		})
	})

	it('accepts a custom instance with only a primary', () => {
		detectLanguage({
			setLanguage: (lang: 'en') => {},
			config: { primary: 'en', secondaries: [] },
		})
	})
})

// ============================
// custom instance — invalid
// ============================

describe('custom instance — invalid', () => {
	it('rejects setLanguage that accepts a wider type than declared', () => {
		detectLanguage({
			// @ts-expect-error setLanguage accepts string — wider than 'en' | 'zh'
			setLanguage: (lang: string) => {},
			config: { primary: 'en', secondaries: ['zh'] },
		})
	})

	it('rejects setLanguage that accepts a narrower type than declared', () => {
		detectLanguage({
			// @ts-expect-error setLanguage only accepts 'en' but secondaries includes 'zh'
			setLanguage: (lang: 'en') => {},
			config: { primary: 'en', secondaries: ['zh'] },
		})
	})

	it('rejects setLanguage that accepts unrelated type', () => {
		detectLanguage({
			// @ts-expect-error 'fr' not declared in config
			setLanguage: (lang: 'en' | 'fr') => {},
			config: { primary: 'en', secondaries: ['zh'] },
		})
	})

	it('rejects undeclared primary language', () => {
		detectLanguage({
			// @ts-expect-error 'klingon' is not a valid BCP47 tag
			setLanguage: (lang: 'klingon' | 'zh') => {},
			// @ts-expect-error 'klingon' is not a valid BCP47 tag
			config: { primary: 'klingon', secondaries: ['zh'] },
		})
	})

	it('rejects undeclared secondary language', () => {
		detectLanguage({
			// @ts-expect-error setLanguage only accepts 'en' | 'klingon'
			setLanguage: (lang: 'en' | 'zh') => {},
			// @ts-expect-error 'klingon' is not a valid BCP47 tag
			config: { primary: 'en', secondaries: ['klingon'] },
		})
	})

	it('rejects primary duplicated in secondaries', () => {
		detectLanguage({
			setLanguage: (lang: 'en' | 'zh') => {},
			// @ts-expect-error 'en' cannot appear in secondaries
			config: { primary: 'en', secondaries: ['en', 'zh'] },
		})
	})
})

// ============================
// options
// ============================

describe('options', () => {
	it('rejects unknown option keys', () => {
		detectLanguage(i18n, {
			// @ts-expect-error unknown key
			unknownOption: true,
		})
	})

	it('rejects non-boolean fallbackToSubtag', () => {
		detectLanguage(i18n, {
			// @ts-expect-error must be boolean
			fallbackToSubtag: 'yes',
		})
	})
})
