import type { BCP47LanguageTagNameWithSubTag } from './kotori'

export const syncLanguage = async <
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
			}
		: T,
	persistenceStorage: {
		get:
			| (() => Parameters<T['setLanguage']>[0] | null | undefined)
			| (() => Promise<Parameters<T['setLanguage']>[0] | null | undefined>)
		set:
			| ((language: Parameters<T['setLanguage']>[0]) => Promise<void>)
			| ((language: Parameters<T['setLanguage']>[0]) => void)
	},
) => {
	// @ts-expect-error
	instance.setLanguage = new Proxy(instance.setLanguage, {
		apply: (target, thisArg, args) => {
			try {
				const result = persistenceStorage.set(
					// @ts-expect-error
					...args,
				)
				if (result instanceof Promise) {
					result.catch((err) => {
						console.error('Failed to persist language:', err)
					})
				}
			} catch (err) {
				console.error('Failed to persist language:', err)
			}

			return Reflect.apply(
				// @ts-expect-error
				target,
				thisArg,
				args,
			)
		},
	})
	try {
		const persistedLanguage = await persistenceStorage.get()
		// @ts-expect-error
		if (persistedLanguage) instance.setLanguage(persistedLanguage)
	} catch (err) {
		console.error('Failed to read persisted language:', err)
	}
}
