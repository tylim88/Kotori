import { beforeEach, describe, expect, it } from 'vitest'
import { kotori } from '.'

describe('kotori', () => {
	describe('basic instance creation', () => {
		it('creates a kotori instance with primary and secondary tags', () => {
			const { t, setLanguage, useT } = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh', 'ja'],
			})

			expect(t).toBeDefined()
			expect(setLanguage).toBeDefined()
			expect(useT).toBeDefined()
		})

		it('supports various language tags', () => {
			const { t } = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh-CN', 'ja-JP', 'ms'],
			})

			expect(t).toBeDefined()
		})
	})

	describe('dict and translation', () => {
		let i18n = kotori({
			primaryLanguageTag: 'en',
			secondaryLanguageTags: ['zh', 'ja'],
		})

		beforeEach(() => {
			i18n = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh', 'ja'],
			})
		})

		it('translates without variables', () => {
			const greeting = i18n.dict({
				en: 'Hello',
				zh: '你好',
				ja: 'こんにちは',
			})

			const result = i18n.t(greeting)
			expect(result).toBe('Hello')
		})

		it('translates with single variable', () => {
			const greeting = i18n.dict({
				en: 'Hello {{name}}',
				zh: '你好 {{name}}',
				ja: 'こんにちは {{name}}',
			})

			const result = i18n.t(greeting, { name: 'John' })
			expect(result).toBe('Hello John')
		})

		it('translates with multiple variables', () => {
			const message = i18n.dict({
				en: '{{greeting}} {{name}}, you are {{age}} years old',
				zh: '{{greeting}} {{name}}，你{{age}}岁了',
				ja: '{{greeting}} {{name}}、あなたは{{age}}歳です',
			})

			const result = i18n.t(message, {
				greeting: 'Hi',
				name: 'Alice',
				age: 25,
			})
			expect(result).toBe('Hi Alice, you are 25 years old')
		})

		it('handles variables with whitespace in template', () => {
			const message = i18n.dict({
				en: 'Value: {{ value }} end',
				zh: '值：{{ value }} 结束',
				ja: '値：{{ value }} 終了',
			})

			const result = i18n.t(message, { value: 'test' })
			expect(result).toBe('Value: test end')
		})

		it('handles numeric variables', () => {
			const score = i18n.dict({
				en: 'Score: {{points}}',
				zh: '分数：{{points}}',
				ja: 'スコア：{{points}}',
			})

			const result = i18n.t(score, { points: 100 })
			expect(result).toBe('Score: 100')
		})

		it('replaces all occurrences of a variable', () => {
			const message = i18n.dict({
				en: '{{word}} {{word}} {{word}}',
				zh: '{{word}} {{word}} {{word}}',
				ja: '{{word}} {{word}} {{word}}',
			})

			const result = i18n.t(message, { word: 'echo' })
			expect(result).toBe('echo echo echo')
		})

		it('handles variables with special regex characters', () => {
			const message = i18n.dict({
				en: 'Pattern: {{pattern}}',
				zh: '图案：{{pattern}}',
				ja: 'パターン：{{pattern}}',
			})

			const result = i18n.t(message, { pattern: '$[.*+?^{}()|\\]' })
			expect(result).toBe('Pattern: $[.*+?^{}()|\\]')
		})

		it('handles empty string variable', () => {
			const message = i18n.dict({
				en: 'Value: {{val}}!',
				zh: '值：{{val}}！',
				ja: '値：{{val}}！',
			})

			const result = i18n.t(message, { val: '' })
			expect(result).toBe('Value: !')
		})

		it('returns fallback message when translation missing', () => {
			const greeting = i18n.dict({
				en: 'Hello',
				zh: '你好',
				ja: 'こんにちは',
			})

			i18n.setLanguage('en')
			expect(i18n.t(greeting)).toBe('Hello')
		})
	})

	describe('language switching', () => {
		let i18n = kotori({
			primaryLanguageTag: 'en',
			secondaryLanguageTags: ['zh', 'ja', 'ms'],
		})

		beforeEach(() => {
			i18n = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh', 'ja', 'ms'],
			})
		})

		it('starts with primary language', () => {
			const greeting = i18n.dict({
				en: 'Hello',
				zh: '你好',
				ja: 'こんにちは',
				ms: 'Halo',
			})

			expect(i18n.t(greeting)).toBe('Hello')
		})

		it('switches to secondary language', () => {
			const greeting = i18n.dict({
				en: 'Hello',
				zh: '你好',
				ja: 'こんにちは',
				ms: 'Halo',
			})

			i18n.setLanguage('zh')
			expect(i18n.t(greeting)).toBe('你好')

			i18n.setLanguage('ja')
			expect(i18n.t(greeting)).toBe('こんにちは')

			i18n.setLanguage('ms')
			expect(i18n.t(greeting)).toBe('Halo')
		})

		it('persists language across multiple translations', () => {
			const greeting = i18n.dict({
				en: 'Hello',
				zh: '你好',
				ja: 'こんにちは',
				ms: 'Halo',
			})

			const farewell = i18n.dict({
				en: 'Goodbye',
				zh: '再见',
				ja: 'さようなら',
				ms: 'Selamat tinggal',
			})

			i18n.setLanguage('zh')
			expect(i18n.t(greeting)).toBe('你好')
			expect(i18n.t(farewell)).toBe('再见')
		})

		it('can switch back to primary language', () => {
			const greeting = i18n.dict({
				en: 'Hello',
				zh: '你好',
				ja: 'こんにちは',
				ms: 'Halo',
			})

			i18n.setLanguage('zh')
			expect(i18n.t(greeting)).toBe('你好')

			i18n.setLanguage('en')
			expect(i18n.t(greeting)).toBe('Hello')
		})
	})

	describe('subscription system', () => {
		let i18n = kotori({
			primaryLanguageTag: 'en',
			secondaryLanguageTags: ['zh', 'ja'],
		})

		beforeEach(() => {
			i18n = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh', 'ja'],
			})
		})

		it('language changes are reflected in translations', () => {
			const greeting = i18n.dict({
				en: 'Hello',
				zh: '你好',
				ja: 'こんにちは',
			})

			expect(i18n.t(greeting)).toBe('Hello')
			i18n.setLanguage('zh')
			expect(i18n.t(greeting)).toBe('你好')
		})
	})

	describe('multiple instances', () => {
		it('maintains separate state for different instances', () => {
			const i18n1 = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh'],
			})

			const i18n2 = kotori({
				primaryLanguageTag: 'fr',
				secondaryLanguageTags: ['es'],
			})

			const greeting1 = i18n1.dict({
				en: 'Hello',
				zh: '你好',
			})

			const greeting2 = i18n2.dict({
				fr: 'Bonjour',
				es: 'Hola',
			})

			expect(i18n1.t(greeting1)).toBe('Hello')
			expect(i18n2.t(greeting2)).toBe('Bonjour')

			i18n1.setLanguage('zh')
			expect(i18n1.t(greeting1)).toBe('你好')
			expect(i18n2.t(greeting2)).toBe('Bonjour') // Should not be affected
		})

		it('allows independent language switching', () => {
			const i18n1 = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh'],
			})

			const i18n2 = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['ja'],
			})

			const greeting1 = i18n1.dict({
				en: 'Hello',
				zh: '你好',
			})

			const greeting2 = i18n2.dict({
				en: 'Hi',
				ja: 'やあ',
			})

			i18n1.setLanguage('zh')
			i18n2.setLanguage('ja')

			expect(i18n1.t(greeting1)).toBe('你好')
			expect(i18n2.t(greeting2)).toBe('やあ')
		})
	})

	describe('edge cases', () => {
		let i18n = kotori({
			primaryLanguageTag: 'en',
			secondaryLanguageTags: ['zh'],
		})
		beforeEach(() => {
			i18n = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh'],
			})
		})

		it('handles empty translation strings', () => {
			const empty = i18n.dict({
				en: '',
				zh: '',
			})

			// Empty translations return empty string
			expect(i18n.t(empty)).toBe('')
		})

		it('handles very long translation strings', () => {
			const longText = 'a'.repeat(10000)
			const longDict = i18n.dict({
				en: longText,
				zh: longText,
			})

			expect(i18n.t(longDict)).toBe(longText)
		})

		it('handles special unicode characters', () => {
			const unicode = i18n.dict({
				en: '🚀 Rocket {{emoji}}',
				zh: '🚀 火箭 {{emoji}}',
			})

			expect(i18n.t(unicode, { emoji: '🎯' })).toBe('🚀 Rocket 🎯')
		})

		it('handles newlines in translation strings', () => {
			const multiline = i18n.dict({
				en: 'Line 1\nLine 2\nLine 3',
				zh: '行1\n行2\n行3',
			})

			expect(i18n.t(multiline)).toContain('Line 1')
			expect(i18n.t(multiline)).toContain('Line 3')
		})

		it('handles variables with newlines', () => {
			const multilineVar = i18n.dict({
				en: 'Text: {{content}}',
				zh: '文本：{{content}}',
			})

			const result = i18n.t(multilineVar, { content: 'Line1\nLine2' })
			expect(result).toBe('Text: Line1\nLine2')
		})

		it('preserves variable case sensitivity', () => {
			const message = i18n.dict({
				en: '{{Name}} and {{name}}',
				zh: '{{Name}} 和 {{name}}',
			})

			const result = i18n.t(message, { Name: 'Alice', name: 'bob' })
			expect(result).toBe('Alice and bob')
		})

		it('converts number to string in variables', () => {
			const count = i18n.dict({
				en: 'You have {{items}} items',
				zh: '你有{{items}}个项目',
			})

			const result = i18n.t(count, { items: 42 })
			expect(result).toBe('You have 42 items')
		})

		it('handles zero as variable value', () => {
			const zero = i18n.dict({
				en: 'Count: {{count}}',
				zh: '计数：{{count}}',
			})

			const result = i18n.t(zero, { count: 0 })
			expect(result).toBe('Count: 0')
		})

		it('handles false in string variable', () => {
			const message = i18n.dict({
				en: 'Value: {{val}}',
				zh: '值：{{val}}',
			})

			const result = i18n.t(message, { val: 'false' })
			expect(result).toBe('Value: false')
		})
	})

	describe('typed variables', () => {
		let i18n = kotori({
			primaryLanguageTag: 'en',
			secondaryLanguageTags: ['zh'],
		})

		beforeEach(() => {
			i18n = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh'],
			})
		})

		it('works with typed variables', () => {
			const timeDict = i18n.dict({
				en: 'Time: {{hour}}:{{minute}}',
				zh: '时间：{{hour}}:{{minute}}',
			})
			const time = timeDict<{ hour: number; minute: number }>

			const result = i18n.t(time, { hour: 14, minute: 30 })
			expect(result).toBe('Time: 14:30')
		})

		it('handles custom types as record', () => {
			const tsDict = i18n.dict({
				en: 'Timestamp: {{ts}}',
				zh: '时间戳：{{ts}}',
			})
			const timestamp = tsDict<{ ts: string }>

			const result = i18n.t(timestamp, { ts: '2024-05-16' })
			expect(result).toBe('Timestamp: 2024-05-16')
		})
	})

	describe('complex scenarios', () => {
		it('handles full workflow', () => {
			const i18n = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh', 'ja', 'es'],
			})

			const welcome = i18n.dict({
				en: 'Welcome {{user}}, you have {{messages}} new messages',
				zh: '欢迎{{user}}，你有{{messages}}条新消息',
				ja: '{{user}}さん、こんにちは。{{messages}}件の新しいメッセージがあります',
				es: 'Bienvenido {{user}}, tienes {{messages}} mensajes nuevos',
			})

			// Test in English
			expect(i18n.t(welcome, { user: 'Alice', messages: 5 })).toBe(
				'Welcome Alice, you have 5 new messages',
			)

			// Switch to Chinese
			i18n.setLanguage('zh')
			expect(i18n.t(welcome, { user: 'Bob', messages: 3 })).toBe(
				'欢迎Bob，你有3条新消息',
			)

			// Switch to Spanish
			i18n.setLanguage('es')
			expect(i18n.t(welcome, { user: 'Carlos', messages: 2 })).toBe(
				'Bienvenido Carlos, tienes 2 mensajes nuevos',
			)

			// Back to English
			i18n.setLanguage('en')
			expect(i18n.t(welcome, { user: 'Diana', messages: 0 })).toBe(
				'Welcome Diana, you have 0 new messages',
			)
		})

		it('handles multiple dictionaries in workflow', () => {
			const i18n = kotori({
				primaryLanguageTag: 'en',
				secondaryLanguageTags: ['zh'],
			})

			const greeting = i18n.dict({
				en: 'Hello {{name}}',
				zh: '你好{{name}}',
			})

			const farewell = i18n.dict({
				en: 'Goodbye {{name}}',
				zh: '再见{{name}}',
			})

			const thanks = i18n.dict({
				en: 'Thank you {{name}}',
				zh: '谢谢你{{name}}',
			})

			expect(i18n.t(greeting, { name: 'John' })).toBe('Hello John')
			expect(i18n.t(farewell, { name: 'Jane' })).toBe('Goodbye Jane')
			expect(i18n.t(thanks, { name: 'Jack' })).toBe('Thank you Jack')

			i18n.setLanguage('zh')

			expect(i18n.t(greeting, { name: '张三' })).toBe('你好张三')
			expect(i18n.t(farewell, { name: '李四' })).toBe('再见李四')
			expect(i18n.t(thanks, { name: '王五' })).toBe('谢谢你王五')
		})
	})
})
