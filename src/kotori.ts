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

export const kotori = <
	const Primary extends AllTags,
	const Secondary extends Exclude<AllTags, Primary>,
>(props: {
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
		(dictionary().d[snapshot.language] || '').replace(
			/\{\{\s*([\w-]+)\s*\}\}/g,
			(_, key) => String(args[0]?.[key]),
		)

	let snapshot = { language: props.primary as Language, t }

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
		r: t,
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

		useT: () =>
			useSyncExternalStore(
				subscribe,
				() => snapshot,
				() => snapshot,
			),
	}
}
