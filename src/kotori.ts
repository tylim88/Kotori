import type { BCP47LanguageTagName } from 'bcp47-language-tags'
import { useSyncExternalStore } from 'react'

export type Tags = BCP47LanguageTagName
export type SubTags = BCP47LanguageTagName extends `${infer SubTag}-${string}`
	? SubTag
	: never
export type BCP47LanguageTagNameWithSubTag = Tags | SubTags

type Trim<T extends string> = T extends ` ${infer R}`
	? Trim<R>
	: T extends `${infer L} `
		? Trim<L>
		: T

type ExtractVariables<T extends string> =
	T extends `${string}{{${infer P}}}${infer Q}`
		? Trim<P> | ExtractVariables<Q>
		: never

declare const _args: unique symbol

/**
 * Creates a scoped i18n instance for your app.
 * Call once and export the returned utilities.
 *
 * @param config - Configuration options.
 * @param config.primary - `BCP47LanguageTag` — The source language. Variable inference and
 * secondary string validation are both driven by this language's strings.
 * @param config.secondaries - `Exclude<BCP47LanguageTag, primary>[]` — Additional supported languages.
 * Cannot include the primary language.
 * @returns `{ d, r, useT, setLanguage, config }`
 *
 * @example
 * ```ts
 * // locales.ts
 * import { kotori } from 'kotori'
 *
 * export const { d, r, useT, setLanguage } = kotori({
 *   primary: 'en',
 *   secondaries: ['zh', 'ja', 'ms'],
 * })
 * ```
 */
export const kotori = <
	const Primary extends BCP47LanguageTagNameWithSubTag,
	const Secondary extends Exclude<BCP47LanguageTagNameWithSubTag, Primary>,
>(config: {
	primary: Primary
	secondaries: Secondary[]
}) => {
	const listeners = new Set<() => void>()
	type Language = Primary | Secondary

	/**
	 * Translates a dict to the current language and interpolates variables.
	 *
	 * @param dictionary - A dict created by `d()`.
	 * @param args - `Record<string, string | number>` — Variable values to interpolate. Required if the dict has variables, omitted if it doesn't.
	 * @returns `string` — The translated and interpolated string.
	 *
	 * @example
	 * const Intro = () => {
	 *     const { t } = useT()
	 *
	 *     return (
	 *         <p>{t(greeting)}</p>                             // ✅ no args needed
	 *         <p>{t(intro, { name: 'John', age: 30 })}</p>     // ✅ typed args
	 *         <p>{t(intro)}</p>                                // ❌ compile error: missing args
	 *         <p>{t(intro, { name: 'John', x: 30 })}</p>       // ❌ compile error: unknown key 'x'
	 *     )
	 * }
	 */
	const t = <
		Dictionary extends () => Readonly<{
			d: Record<Language, string>
			[_args]?: Record<string, string | number>
		}>,
	>(
		dictionary: Dictionary,
		...args: keyof NonNullable<
			ReturnType<Dictionary>[typeof _args]
		> extends never
			? []
			: [NonNullable<ReturnType<Dictionary>[typeof _args]>]
	) =>
		(dictionary().d[snapshot.language] || '').replace(
			/\{\{\s*([\w-]+)\s*\}\}/g,
			(_, key) => args[0]?.[key] as string,
		)

	let snapshot = { language: config.primary as Language, t }

	/**
	 * Updates the current language and triggers a rerender in all active
	 * `useT()` consumers across all pages. Safe to call outside React.
	 *
	 * @param language - `Language` — Must be one of the tags declared in
	 * `primary` or `secondaries`. Any other value is a compile error.
	 * @returns `void`
	 *
	 * @example
	 * ```ts
	 * import { setLanguage } from './locales'
	 *
	 * setLanguage('zh')      // ✅
	 * setLanguage('ms')      // ✅
	 * setLanguage('de')      // ❌ compile error: 'de' was not declared
	 *
	 * // persist and restore language selection
	 * setLanguage('zh')
	 * localStorage.setItem('lang', 'zh')
	 *
	 * // restore on app startup
	 * const saved = localStorage.getItem('lang')
	 * if (saved) setLanguage(saved as 'en')
	 * ```
	 */
	const setLanguage = (language: Language) => {
		snapshot = {
			language,
			//@ts-expect-error type doesn't matter here, we just want to return new functions reference
			t: (...args) => t(...args),
		}
		listeners.forEach((listener) => listener())
	}
	const subscribe = (listener: () => void) => {
		listeners.add(listener)
		return () => listeners.delete(listener)
	}

	return {
		config,
		setLanguage,
		/**
		 * Translates a dict to the current language and interpolates variables.
		 * For use **outside** React components — route guards, axios interceptors,
		 * utility functions, etc.
		 *
		 * ⚠️ Do not use inside React components. The React Compiler will memoize
		 * the result permanently since `r` is a stable module-level reference,
		 * causing stale translations after a language change. Use `t` from `useT()`
		 * inside components instead.
		 *
		 * @param dictionary - A dict created by `d()`.
		 * @param args - `Record<string, string | number>` — Variable values to interpolate.
		 * Required if the dict has variables, omitted if it doesn't.
		 * @returns `string` — The translated and interpolated string in the current language.
		 *
		 * @example
		 * ```ts
		 * import { r, greeting, intro } from './locales'
		 *
		 * r(greeting)                          // ✅ no args needed
		 * r(intro, { name: 'John', age: 30 })  // ✅ typed args
		 * r(intro)                             // ❌ compile error: missing args
		 * r(intro, { name: 'John', x: 1 })     // ❌ compile error: unknown key 'x'
		 *
		 * // route guard
		 * router.beforeEach(() => {
		 *   document.title = r(pageTitle)
		 * })
		 *
		 * // axios interceptor
		 * axios.interceptors.response.use(null, () => {
		 *   toast.error(r(errorMessage))
		 * })
		 * ```
		 */
		r: t,
		/**
		 * Defines a translation unit. The primary language string drives variable
		 * inference — all secondary strings are validated against it at compile time.
		 *
		 * Call with an optional generic to narrow variable types beyond the default
		 * `string | number`. Supports TypeScript template literal types.
		 *
		 * @param dictionary - `Record<Language, string>` — One string per language.
		 * Variables are declared with `{{variableName}}` syntax. Spaces inside braces
		 * are trimmed — `{{ name }}` and `{{name}}` are equivalent.
		 * Secondary strings must use exactly the same variable names as the primary.
		 * @returns A function optionally accepting a generic to narrow variable types,
		 * which returns the translation unit.
		 *
		 * @example
		 * ```ts
		 * // no variables
		 * const greeting = d({ en: 'Hello', zh: '你好', ja: 'こんにちは', ms: 'Helo' })()
		 *
		 * // variables — inferred as Record<'name' | 'age', string | number> by default
		 * const intro = d({
		 *   en: 'My name is {{name}}, I am {{age}} years old.',
		 *   zh: '我叫{{name}}，我今年{{age}}岁了。',
		 *   ja: '私の名前は{{name}}で、{{age}}歳です。',
		 *   ms: 'Nama saya {{name}}, saya berumur {{age}} tahun.',
		 * })()
		 *
		 * // narrowed variable types via generic
		 * const clock = d({
		 *   en: 'Current time: {{hour}}:{{minute}}',
		 *   zh: '现在时间：{{hour}}:{{minute}}',
		 *   ja: '現在時刻：{{hour}}:{{minute}}',
		 *   ms: 'Masa semasa: {{hour}}:{{minute}}',
		 * })<{ hour: number; minute: number }>()
		 *
		 * // TypeScript template literal types work too
		 * const lastLogin = d({
		 *   en: 'Last login: {{date}}',
		 *   zh: '上次登录：{{date}}',
		 *   ja: '最終ログイン：{{date}}',
		 *   ms: 'Log masuk terakhir: {{date}}',
		 * })<{ date: `${number}-${number}-${number}` }>()
		 *
		 * // ❌ compile error — 'ja' translation missing
		 * const bad1 = d({ en: 'Hello', zh: '你好', ms: 'Helo' })()
		 *
		 * // ❌ compile error — secondary string has wrong variable name
		 * const bad2 = d({ en: 'Hello {{name}}', zh: '你好 {{naam}}', ja: 'こんにちは {{name}}', ms: 'Helo {{name}}' })()
		 *
		 * // ❌ compile error — secondary string missing a variable
		 * const bad3 = d({ en: '{{x}} {{y}}', zh: '{{x}}', ja: '{{x}} {{y}}', ms: '{{x}} {{y}}' })()
		 * ```
		 */
		d:
			<
				const PrimaryString extends string,
				const SecondaryObject extends {
					[Key in Secondary]: ExtractVariables<PrimaryString> extends infer PrimaryVariables
						? ExtractVariables<
								SecondaryObject[Key] & string
							> extends infer SecondaryVariables
							? PrimaryVariables[] extends SecondaryVariables[]
								? SecondaryVariables[] extends PrimaryVariables[]
									? SecondaryObject[Key]
									: 'variables not match!'
								: 'variables not match!!'
							: never
						: never
				},
			>(
				dictionary: { [Key in Primary]: PrimaryString } & SecondaryObject,
			) =>
			<
				const ArgsType extends Record<
					ExtractVariables<PrimaryString>,
					string | number
				> = Record<ExtractVariables<PrimaryString>, string | number>,
			>() =>
				({ d: dictionary }) as Readonly<{
					d: typeof dictionary
					[_args]?: ArgsType
				}>,

		/**
		 * React hook. Subscribes the component to language changes.
		 * Returns a snapshot containing the current `language` and a
		 * React Compiler-safe `t` function.
		 *
		 * Call in every component that renders translated strings.
		 * When `setLanguage` is called anywhere, all `useT()` consumers rerender.
		 *
		 * @returns `{ language: Language, t: TranslateFunction }`
		 * @returns `language` - `Language` — The current active language tag as a reactive value.
		 * @returns `t` - `TranslateFunction` — React Compiler-safe translate function. Use this inside components instead of the instance-level `t`.
		 *
		 * @example
		 * ```tsx
		 * import { useT, intro, time } from './locales'
		 *
		 * const Page = () => {
		 *   const { t, language } = useT()
		 *
		 *   return (
		 *     <>
		 *       <p>{t(intro, { name: 'John', age: 30 })}</p>
		 *       <p>{t(time, { hour: 12, minute: 0 })}</p>
		 *       <p>Current language: {language}</p>
		 *     </>
		 *   )
		 * }
		 * ```
		 */
		useT: () =>
			useSyncExternalStore(
				subscribe,
				() => snapshot,
				() => snapshot,
			),
	}
}
