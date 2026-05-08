import type { BCP47LanguageTagName } from 'bcp47-language-tags'
import { useMemo, useSyncExternalStore } from 'react'

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
	let languageTag: WorkingTags = props.primaryLanguageTag

	const snapshots = new Map<string | symbol, object>()
	const refcount = new Map<string | symbol, number>()

	const setLanguage = (tag: WorkingTags) => {
		languageTag = tag
		snapshots.forEach((snapshot, key) => {
			snapshots.set(key, { ...snapshot, language: tag })
		})
		listeners.forEach((listener) => {
			listener()
		})
	}

	return {
		setLanguage,
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
		useTranslations: <
			const DictCallbacks extends Record<
				string,
				() => Readonly<{
					translation: Record<WorkingTags, string>
					[_args]?: Record<string, string | number>
				}>
			>,
		>(
			dictCallbacks: DictCallbacks,
			uniqueKey?: string,
		) => {
			const { s, snapshot, subscribe } = useMemo(() => {
				const s = uniqueKey ?? Symbol()

				const existingSnapshot = snapshots.get(s)

				const snapshot = {
					language: languageTag,
					setLanguage,
					t: <Key extends keyof DictCallbacks>(
						key: Key,
						...args: keyof NonNullable<
							ReturnType<DictCallbacks[Key]>[typeof _args]
						> extends never
							? []
							: [NonNullable<ReturnType<DictCallbacks[Key]>[typeof _args]>]
					) => {
						let locale =
							dictCallbacks[key]?.().translation[languageTag] ||
							'unable_to_load_translations'
						for (const objKey in args[0]) {
							locale = locale.replace(
								new RegExp(`\\{\\{\\s*${objKey}\\s*\\}\\}`, 'g'),
								() => String(args[0]?.[objKey]),
							)
						}
						return locale as string
					},
				}
				const subscribe = (listener: () => void) => {
					listeners.add(listener)
					const prevCount = refcount.get(s) || 0
					refcount.set(s, Math.max(0, prevCount) + 1)
					if (!snapshots.get(s)) {
						snapshots.set(s, snapshot)
					}
					return () => {
						const count = (refcount.get(s) ?? 1) - 1
						refcount.set(s, count)
						if (count < 1) {
							snapshots.delete(s)
						}
						listeners.delete(listener)
					}
				}
				if (existingSnapshot)
					return {
						s,
						snapshot: existingSnapshot as typeof snapshot,
						subscribe,
					}

				snapshots.set(s, snapshot)
				return { s, snapshot, subscribe }
			}, [])

			return useSyncExternalStore(
				subscribe,
				() => snapshots.get(s) as typeof snapshot,
				() => snapshot,
			)
		},
	}
}
