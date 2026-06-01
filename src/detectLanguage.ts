import type { BCP47LanguageTagNameWithSubTag } from './kotori'

/**
 * Detects the user's preferred language from browser settings and sets it
 * on the kotori instance. Iterates through the user's full language preference
 * list in order, stopping at the first match.
 *
 * @param instance - An object with `setLanguage` and `config`. Compatible with
 * the kotori instance returned by `kotori()`, or any custom object that satisfies
 * the same shape — allowing use with non-kotori setups.
 * @param instance.setLanguage - `(language: BCP47LanguageTagNameWithSubTag) => void` — Called with the
 * first matched language. Can be any callback — a kotori `setLanguage`, a React
 * state setter, a Zustand action, etc.
 * @param instance.config - Language configuration.
 * @param instance.config.primary - `BCP47LanguageTagNameWithSubTag` — The primary/fallback language tag.
 * @param instance.config.secondaries - `Exclude<AllTags, primary>[]` — Additional supported language tags. Cannot include the primary language.
 * @param options - Detection options.
 * @param options.fallbackToSubtag - `boolean` — If no exact match is found (e.g. `'zh-CN'`),
 * fall back to the subtag (e.g. `'zh'`). Defaults to `true`.
 * @returns `void` — Calls `setLanguage` on the first match. No-op if no match is found.
 *
 * @example
 * ```ts
 * // with kotori instance
 * import { kotori, detectLanguage } from 'kotori'
 *
 * const i18n = kotori({
 *   primary: 'en',
 *   secondaries: ['zh', 'ja', 'ms'],
 * })
 *
 * detectLanguage(i18n)
 * // browser: ['zh-CN', 'en-US'] → subtag 'zh' → setLanguage('zh') ✅
 *
 * detectLanguage(i18n, { fallbackToSubtag: false })
 * // browser: ['zh-CN'] → no exact match → no-op, stays 'en'
 * ```
 *
 * @example
 * ```ts
 * // ✅ setLanguage type exactly matches primary + secondaries union
 * detectLanguage({
 *   setLanguage: (lang: 'en' | 'zh' | 'ja') => setLang(lang),
 *   config: {
 *     primary: 'en',
 *     secondaries: ['zh', 'ja'],
 *   },
 * })
 *
 * // ❌ compile error — setLanguage accepts wider type than declared
 * detectLanguage({
 *   setLanguage: (lang: string) => setLang(lang),
 *   config: { primary: 'en', secondaries: ['zh'] },
 * })
 * ```
 */
export const detectLanguage = <
	const T extends {
		setLanguage: (language: Parameters<T['setLanguage']>[0]) => void
		config: {
			primary: BCP47LanguageTagNameWithSubTag
			secondaries: BCP47LanguageTagNameWithSubTag[]
		}
	},
>(
	instance:
		| T['config']['primary']
		| T['config']['secondaries'][number] extends infer A
		? {
				setLanguage: Parameters<T['setLanguage']>[0] extends infer L
					? L[] extends BCP47LanguageTagNameWithSubTag[]
						? A[] extends L[]
							? (language: L) => void
							: 'language param does not match primary or secondaries language types'
						: 'language param does not match BCP47LanguageTagNameWithSubTag types'
					: never
				config: {
					primary: T['config']['primary']
					secondaries: Exclude<
						BCP47LanguageTagNameWithSubTag,
						T['config']['primary']
					>[]
				}
			}
		: T,
	options: { fallbackToSubtag?: boolean } = { fallbackToSubtag: true },
) => {
	const languages = [instance.config.primary, ...instance.config.secondaries]

	for (const browserLang of navigator.languages as BCP47LanguageTagNameWithSubTag[]) {
		if (languages.includes(browserLang))
			// @ts-expect-error
			return instance.setLanguage(browserLang)
		if (options.fallbackToSubtag) {
			const subtag = browserLang.split('-')[0] as BCP47LanguageTagNameWithSubTag

			if (languages.includes(subtag))
				// @ts-expect-error
				return instance.setLanguage(subtag)
		}
	}
}
