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
	const PrimaryTag extends AllTags,
	const SecondaryTags extends Exclude<AllTags, PrimaryTag>,
>(props: {
	primaryLanguageTag: PrimaryTag
	secondaryLanguageTags: SecondaryTags[]
}) => {
	const listeners = new Set<() => void>()
	type WorkingTags = PrimaryTag | SecondaryTags
	let language = props.primaryLanguageTag as WorkingTags

	const setLanguage = (tag: WorkingTags) => {
		language = tag
		snapshot = { ...snapshot, language }
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
	const t = <
		DictCallback extends () => Readonly<{
			translation: Record<WorkingTags, string>
			[_args]?: Record<string, string | number>
		}>,
	>(
		dict: DictCallback,
		...args: keyof NonNullable<
			ReturnType<DictCallback>[typeof _args]
		> extends never
			? []
			: [NonNullable<ReturnType<DictCallback>[typeof _args]>]
	) => {
		let locale = dict().translation[language] || 'unable_to_load_translations'
		for (const objKey in args[0]) {
			locale = locale.replace(
				new RegExp(`\\{\\{\\s*${objKey}\\s*\\}\\}`, 'g'),
				() => String(args[0]?.[objKey]),
			)
		}
		return locale as string
	}
	let snapshot = {
		language,
	}

	return {
		setLanguage,
		t,
		dict:
			<
				const PrimaryString extends string,
				const SecondaryObject extends {
					[Key in SecondaryTags]: ExtractVariables<PrimaryString> extends infer PrimaryVariables
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
				translation: { [Key in PrimaryTag]: PrimaryString } & SecondaryObject,
			) =>
			<
				const ArgsType extends Record<
					ExtractVariables<PrimaryString>,
					string | number
				> = Record<ExtractVariables<PrimaryString>, string | number>,
			>() =>
				({ translation }) as Readonly<{
					translation: typeof translation
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
