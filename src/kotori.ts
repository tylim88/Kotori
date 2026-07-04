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
 * @see {@link https://github.com/tylim88/Kotori#kotorioptions-028kb}
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
		(
			dictionary().d[snapshot.language] +
			// prevent potential runtime crash if user ignore type safety
			''
		).replace(
			/\{\{\s*([\w-]+)\s*\}\}/g,
			(_, key) =>
				args[0]?.[key] +
				// prevent potential runtime crash if user ignore type safety
				'',
		)

	let snapshot = { language: config.primary as Language, t }

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
		/**
		 * Updates the current language and triggers a rerender in all active
		 * `useT()` consumers across all pages. Safe to call outside React.
		 */
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
		 */
		r: t,
		/**
		 * Defines a translation unit. The primary language string drives variable
		 * inference — all secondary strings are validated against it at compile time.
		 *
		 * Call with an optional generic to narrow variable types beyond the default
		 * `string | number`. Supports TypeScript template literal types.
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
		 */
		useT: () =>
			useSyncExternalStore(
				subscribe,
				() => snapshot,
				() => snapshot,
			),
	}
}
