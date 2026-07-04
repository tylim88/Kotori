import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncLanguage } from './syncLanguage'

const mockInstance = (primary: string, secondaries: string[]) => {
	const setLanguage = vi.fn()
	return {
		setLanguage,
		config: { primary, secondaries },
	}
}

afterEach(() => {
	vi.restoreAllMocks()
})

// ============================
// get — restoring persisted language
// ============================

describe('get', () => {
	it('calls setLanguage with persisted language on init', async () => {
		const instance = mockInstance('en', ['zh', 'ja'])

		await syncLanguage(instance as any, {
			get: () => 'zh',
			set: () => {},
		})

		expect(instance.setLanguage).toHaveBeenCalledWith('zh')
		expect(instance.setLanguage).toHaveBeenCalledTimes(1)
	})

	it('calls setLanguage with persisted language from async get', async () => {
		const instance = mockInstance('en', ['zh', 'ja'])

		await syncLanguage(instance as any, {
			get: async () => 'ja',
			set: () => {},
		})

		expect(instance.setLanguage).toHaveBeenCalledWith('ja')
		expect(instance.setLanguage).toHaveBeenCalledTimes(1)
	})

	it('does not call setLanguage when get returns null', async () => {
		const instance = mockInstance('en', ['zh', 'ja'])

		await syncLanguage(instance as any, {
			get: () => null,
			set: () => {},
		})

		expect(instance.setLanguage).not.toHaveBeenCalled()
	})

	it('does not call setLanguage when get returns undefined', async () => {
		const instance = mockInstance('en', ['zh', 'ja'])

		await syncLanguage(instance as any, {
			get: () => undefined,
			set: () => {},
		})

		expect(instance.setLanguage).not.toHaveBeenCalled()
	})

	it('does not throw when get throws — logs error instead', async () => {
		const instance = mockInstance('en', ['zh'])
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		await syncLanguage(instance as any, {
			get: () => {
				throw new Error('storage unavailable')
			},
			set: () => {},
		})

		expect(instance.setLanguage).not.toHaveBeenCalled()
		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to read persisted language:',
			expect.any(Error),
		)
	})

	it('does not throw when async get rejects — logs error instead', async () => {
		const instance = mockInstance('en', ['zh'])
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		await syncLanguage(instance as any, {
			get: async () => {
				throw new Error('storage unavailable')
			},
			set: () => {},
		})

		expect(instance.setLanguage).not.toHaveBeenCalled()
		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to read persisted language:',
			expect.any(Error),
		)
	})
})

// ============================
// set — persisting on language change
// ============================

describe('set', () => {
	it('calls set when setLanguage is called', async () => {
		const instance = mockInstance('en', ['zh', 'ja'])
		const set = vi.fn()

		await syncLanguage(instance as any, {
			get: () => null,
			set,
		})

		instance.setLanguage('zh')

		expect(set).toHaveBeenCalledWith('zh')
		expect(set).toHaveBeenCalledTimes(1)
	})

	it('still calls original setLanguage when set succeeds', async () => {
		const instance = mockInstance('en', ['zh'])
		const originalSetLanguage = instance.setLanguage

		await syncLanguage(instance as any, {
			get: () => null,
			set: () => {},
		})

		instance.setLanguage('zh')

		expect(originalSetLanguage).toHaveBeenCalledWith('zh')
	})

	it('still calls original setLanguage when set throws', async () => {
		const instance = mockInstance('en', ['zh'])
		const originalSetLanguage = instance.setLanguage
		vi.spyOn(console, 'error').mockImplementation(() => {})

		await syncLanguage(instance as any, {
			get: () => null,
			set: () => {
				throw new Error('write failed')
			},
		})

		instance.setLanguage('zh')

		expect(originalSetLanguage).toHaveBeenCalledWith('zh')
	})

	it('does not throw when set throws — logs error instead', async () => {
		const instance = mockInstance('en', ['zh'])
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		await syncLanguage(instance as any, {
			get: () => null,
			set: () => {
				throw new Error('write failed')
			},
		})

		instance.setLanguage('zh')

		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to persist language:',
			expect.any(Error),
		)
	})

	it('does not throw when async set rejects — logs error instead', async () => {
		const instance = mockInstance('en', ['zh'])
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		await syncLanguage(instance as any, {
			get: () => null,
			set: async () => {
				throw new Error('write failed')
			},
		})

		instance.setLanguage('zh')

		// allow microtask queue to flush
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to persist language:',
			expect.any(Error),
		)
	})

	it('persists every language change in order', async () => {
		const instance = mockInstance('en', ['zh', 'ja'])
		const set = vi.fn()

		await syncLanguage(instance as any, {
			get: () => null,
			set,
		})

		instance.setLanguage('zh')
		instance.setLanguage('ja')
		instance.setLanguage('en')

		expect(set).toHaveBeenCalledTimes(3)
		expect(set).toHaveBeenNthCalledWith(1, 'zh')
		expect(set).toHaveBeenNthCalledWith(2, 'ja')
		expect(set).toHaveBeenNthCalledWith(3, 'en')
	})
})
