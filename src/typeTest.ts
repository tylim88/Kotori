// don't rename this file to *.test.ts
// here we only test the types, no runtime involve
// this will throw if vitest runs it

import { describe, expectTypeOf, it } from 'vitest'
import { kotori } from '.'

const { dict, useT, setLanguage, t } = kotori({
	primaryLanguageTag: 'en',
	secondaryLanguageTags: ['zh', 'ja'],
})

const noVars = dict({ en: 'hello', zh: '你好', ja: 'こんにちは' })
const oneVar = dict({
	en: 'hello {{name}}',
	zh: '你好 {{name}}',
	ja: 'こんにちは {{name}}',
})
const twoVars = dict({
	en: '{{x}} {{y}}',
	zh: '{{x}} {{y}}',
	ja: '{{x}} {{y}}',
})
const typedVar = dict({
	en: 'time {{time}}',
	zh: '时间 {{time}}',
	ja: '時間 {{time}}',
})<{ time: `${number}:${number}` }>

declare const language: ReturnType<typeof useT>['language']

// ============================
// dict — variable mismatch
// ============================

describe('dict', () => {
	it('rejects wrong variable in secondary string', () => {
		dict({
			en: 'hello {{name}}',
			// @ts-expect-error wrong variable name
			zh: '你好 {{naam}}',
			ja: 'こんにちは {{name}}',
		})
	})

	it('rejects extra variable in secondary string', () => {
		dict({
			en: 'hello {{name}}',
			// @ts-expect-error extra variable
			zh: '你好 {{name}} {{extra}}',
			ja: 'こんにちは {{name}}',
		})
	})

	it('rejects missing variable in secondary string', () => {
		// @ts-expect-error missing variable
		dict({ en: 'hello {{name}}', zh: '你好', ja: 'こんにちは {{name}}' })
	})

	it('rejects missing secondary language', () => {
		// @ts-expect-error missing ja
		dict({ en: 'hello', zh: '你好' })
	})

	it('rejects missing primary language', () => {
		// @ts-expect-error missing en
		dict({ zh: '你好', ja: 'こんにちは' })
	})
})

// ============================
// t — args required / omitted
// ============================

describe('t', () => {
	it('returns string', () => {
		expectTypeOf(t(noVars)).toEqualTypeOf<string>()
		expectTypeOf(t(oneVar, { name: 'John' })).toEqualTypeOf<string>()
	})

	it('omits args when no variables', () => {
		t(noVars)
	})

	it('requires args when variables exist', () => {
		// @ts-expect-error missing args
		t(oneVar)
	})

	it('rejects args when no variables', () => {
		// @ts-expect-error no args expected
		t(noVars, { name: 'John' })
	})

	it('accepts correct args', () => {
		t(oneVar, { name: 'John' })
		t(twoVars, { x: 'a', y: 1 })
	})

	it('rejects missing key in args', () => {
		// @ts-expect-error missing name
		t('oneVar', {})
		// @ts-expect-error wrong key
		t('oneVar', { naam: 'John' })
	})

	it('rejects extra key in args', () => {
		// @ts-expect-error extra key
		t(oneVar, { name: 'John', extra: 'x' })
	})

	it('enforces custom arg types', () => {
		t(typedVar, { time: '12:00' })
	})

	it('rejects wrong format for custom arg types', () => {
		// @ts-expect-error wrong format
		t(typedVar, { time: '12-00' })
		// @ts-expect-error number not assignable to template literal
		t(typedVar, { time: 123 })
	})
})

// ============================
// language
// ============================

describe('language', () => {
	it('is typed as union of working tags', () => {
		expectTypeOf(language).toEqualTypeOf<'en' | 'zh' | 'ja'>()
	})
})

// ============================
// setLanguage
// ============================

describe('setLanguage', () => {
	it('accepts declared tags', () => {
		setLanguage('en')
		setLanguage('zh')
		setLanguage('ja')
	})

	it('rejects undeclared tags', () => {
		// @ts-expect-error ms not declared
		setLanguage('ms')
		// @ts-expect-error invalid tag
		setLanguage('klingon')
	})
})
