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

export type ExtractVariables<T extends string> =
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

	const snapshots = new Map<symbol, object>()

	return {
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
				> = Record<ExtractVariables<PrimaryString>, string>,
			>() =>
				({ translation }) as Readonly<{
					translation: typeof translation
					[_args]?: ArgsType
				}>,
		createTranslations: <
			const DictCallbacks extends Record<
				string,
				() => Readonly<{
					translation: Record<WorkingTags, string>
					[_args]?: Record<string, string | number>
				}>
			>,
		>(
			dictCallbacks: DictCallbacks,
		) => {
			const s = Symbol()
			const snapshotBuilder = () => ({
				getLanguage: () => languageTag,
				setLanguage: (tag: WorkingTags) => {
					languageTag = tag
					snapshots.forEach((snapshot, key) => {
						snapshots.set(key, { ...snapshot })
					})
					listeners.forEach((listener) => {
						listener()
					})
				},
				t: <Key extends keyof DictCallbacks>(
					key: Key,
					...args: keyof NonNullable<
						ReturnType<DictCallbacks[Key]>[typeof _args]
					> extends never
						? []
						: [NonNullable<ReturnType<DictCallbacks[Key]>[typeof _args]>]
				) => {
					let locale = dictCallbacks[key]?.().translation[languageTag]
					if (!locale) return
					for (const objKey in args[0]) {
						locale = locale.replace(
							new RegExp(`\\{\\{\\s*${objKey}\\s*\\}\\}`, 'g'),
							() => String(args[0]?.[objKey]),
						)
					}
					return locale
				},
			})
			snapshots.set(s, snapshotBuilder())
			return {
				useTranslations: () =>
					useSyncExternalStore(
						(listener) => {
							listeners.add(listener)
							return () => listeners.delete(listener)
						},
						() => snapshots.get(s) as ReturnType<typeof snapshotBuilder>,
					),
			}
		},
	}
}

// const { createTranslations, dict } = kotori({
// 	primaryLanguageTag: 'en',
// 	secondaryLanguageTags: ['zh'],
// })
// const dict1 = dict({ en: '{{x}} {{ y }}', zh: '{{x}} {{y}}' })<{
// 	x: string
// 	y: number
// }>
// const dict3 = dict({ en: '{{a}} {{ b }}', zh: '{{a}} {{b}}' })<{
// 	a: number
// 	b: string
// }>
// const dict2 = dict({ en: 'a', zh: 'b' })

// const { useTranslations } = createTranslations({ dict1, dict2, dict3 })

// const abc = () => {
// 	const { getLanguage, setLanguage, t } = useTranslations()
// 	t('dict1', { x: '1', y: 1 })
// 	t('dict2')
// 	t('dict2', { x: '1', y: 1 })
// 	t('dict3', { a: 1, b: 'v' })
// }
