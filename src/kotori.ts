import type { BCP47LanguageTagName } from 'bcp47-language-tags'
import { useSyncExternalStore } from 'react'

export type Tags = BCP47LanguageTagName
export type SubTags = BCP47LanguageTagName extends `${infer SubTag}-${string}`
	? SubTag
	: never
export type AllTags = Tags | SubTags

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
 * @param {Object} props - Configuration options
 * @param props.primary - {BCP47LanguageTag} — The source language. All other strings are validated against it.
 * @param props.secondaries - `BCP47LanguageTag[]` — Additional supported languages.
 * @returns `{ d, t, useT, setLanguage }`
 *
 * @example
 * ```ts
 * // locales.ts
 * import { kotori } from 'kotori'
 *
 * export const { d, useT, setLanguage, r } = kotori({
 *   primary: 'en',
 *   secondaries: ['zh', 'ja', 'ms'],
 * })
 * ```
 */
export const kotori = <
	const Primary extends AllTags,
	const Secondary extends Exclude<AllTags, Primary>,
>(props: {
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
			(_, key) => String(args[0]?.[key]),
		)

	let snapshot = { language: props.primary as Language, t }

	/**
	 * Updates the current language and triggers a rerender in all active
	 * `useT()` consumers across all pages. Safe to call outside React.
	 *
	 * @param language - `Language` — Must be one of the tags declared in `primary` or `secondaries`.
	 *
	 * @example
	 * ```ts
	 * import { setLanguage } from './locales'
	 *
	 * setLanguage('zh')    // ✅
	 * ```
	 */
	const setLanguage = (language: Language) => {
		snapshot = {
			language,
			//@ts-expect-error
			t: (...args) => t(...args),
		}
		listeners.forEach((listener) => {
			listener()
		})
	}
	const subscribe = (listener: () => void) => {
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	}

	return {
		s: props.secondaries,
		setLanguage,
		/**
		 * Translates a dict to the current language and interpolates variables.
		 * for use outside React components (route guards, axios interceptors, etc.).
		 *
		 * ⚠️ Do not call this inside React components (it will break React Compiler optimization rules).
		 * Use this exclusively in raw JS/TS environments like router guards, API interceptors, or state utilities.
		 *
		 * @param dictionary - A dict created by `d()`.
		 * @param args - `Record<string, string | number>` — Variable values to interpolate. Required if the dict has variables, omitted if it doesn't.
		 * @returns `string` — The translated and interpolated string.
		 *
		 * @example
		 * ```ts
		 * // outside React — use t from kotori instance
		 * import { r } from './locales'
		 *
		 * r(greeting)                             // ✅ no args needed
		 * r(intro, { name: 'John', age: 30 })     // ✅ typed args
		 * ```
		 */
		r: t,
		/**
		 * Defines a translation unit. The primary string drives variable inference —
		 * all secondary strings are validated against it at compile time.
		 *
		 * @param dictionary - `Record<Language, string>` — One string per language. Secondary strings must use the same variables as the primary.
		 * @returns A function that optionally accepts a generic to narrow variable types.
		 *
		 * @example
		 * ```ts
		 * // no variables
		 * const greeting = d({ en: 'Hello', zh: '你好', ja: 'こんにちは' })()
		 *
		 * // with inferred variables — defaults to Record<'name' | 'age', string | number>
		 * const intro = d({
		 *   en: 'My name is {{name}}, I am {{age}} years old.',
		 *   zh: '我叫{{name}}，我今年{{age}}岁了。',
		 *   ja: '私の名前は{{name}}で、{{age}}歳です。',
		 * })()
		 *
		 * // with narrowed variable types
		 * const time = d({
		 *   en: 'Current time: {{hour}}:{{minute}}',
		 *   zh: '现在时间：{{hour}}:{{minute}}',
		 *   ja: '現在時刻：{{hour}}:{{minute}}',
		 * })<{ hour: number; minute: number }>()
		 *
		 * // ❌ compile error — secondary string has wrong variable
		 * const bad = d({ en: 'Hello {{name}}', zh: '你好 {{naam}}' })()
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
