<p align="center">
  <img src="logo.webp" alt="kotori i18n logo">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kotori"><img src="https://img.shields.io/npm/v/kotori?color=blue" alt="NPM Version"></a>
  <a href="https://codecov.io/gh/tylim88/Kotori"><img src="https://img.shields.io/codecov/c/github/tylim88/Kotori?branch=main" alt="Coverage"></a>
  <img src="https://img.shields.io/badge/bundle%20size-0.29kB-emerald" alt="Bundle Size">
  <a href="https://github.com/tylim88/Kotori/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tylim88/Kotori?color=blue" alt="License"></a>
  <img src="https://img.shields.io/badge/dependencies-0-success" alt="Dependencies">
  <a href="https://snyk.io/test/github/tylim88/Kotori">
    <img src="https://snyk.io/test/github/tylim88/Kotori/badge.svg" alt="Snyk Vulnerabilities for npm package">
  </a>
</p>

<p align="center">
🕊️ Kotori is a zero-config, fully type-safe, and modular internationalization library for React that compiles down to just 0.29kB. No JSON, no external CLI tools, no codegen—just live type inference from your strings.
</p>

```ts
const { d, useT } = kotori({
    primary: 'en',
    secondaries: ['zh', 'ja', 'ms'],
})

// ❌ TypeScript error: missing japanese translation
const intro = d({ 
    // ⭐ base string drives the type contract
    en: 'Hello {{name}}, is it {{time}} now?', 

     // ❌ TypeScript error: missing key 'name' 
    zh: '你好，现在是 {{time}} 吗？',

    // ❌ TypeScript error: unknown key 'nam'      
    ms: 'Hai {{nam}}, adakah pukul {{time}} sekarang?'  

// optional: type your arguments, by default it's `Record<'name'|'time', string | number>` in this example
})<{name: string; time: `${number}:${number}`}> 

const Component = () => {
    const { t } = useT()

    // ✅ Works
    t(intro, { name: 'John', time: '12:25' }) 

    // ❌ TypeScript error: missing { name }
    t(intro, { time: '12:25' })

    // ❌ TypeScript error: unknown key 'nama'                   
    t(intro, { nama: 'John', time: '12:25' }) 

    // ❌ TypeScript error: invalid format for 'time'
    t(intro, { name: 'John', time: '12-00' }) 
}
```

- No codegen
- No JSON
- No dependencies
- No build step
- 0.29kB minified and gzipped
- Modular and tree-shakeable
- Language change in one page rerenders all pages
- Variables typed and inferred from string literals — no more string typos
- Maximum type safety with minimum types

Demo: <https://github.com/tylim88/kotori-demo>

## Installation

```bash
npm i kotori
```

## Quick Start

### locales.ts

```ts
import { kotori } from 'kotori'

export const { useT, d, setLanguage } = kotori({
    primary: 'en',
    secondaries: ['zh', 'ja', 'ms'],
})

// you can define your dicts in the same file/folder or separate them by component, it's up to you
export const intro = d({
    en: 'my name is {{name}}, I am {{age}} years old.',
    zh: '我叫{{name}}，我今年{{age}}岁了。',
    ja: '私の名前は{{name}}で、{{age}}歳です。',
    ms: 'nama saya {{name}}, saya berumur {{age}} tahun.',
})

export const time = d({
    en: 'time {{time}}',
    zh: '时间 {{time}}',
    ja: '時間 {{time}}',
    ms: 'waktu {{time}}',
// optional: type your arguments, by default it's `Record<'time', string | number>` in this example
})<{ time: `${number}:${number}:${number}` }> 
```

### page1.tsx

```tsx
import { useT, setLanguage, intro, time } from './locales'

export const Page1 = () => {

    const { language, t } = useT()

    return (
        <>
            <select
                name="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en')}
            >
                <option value="en">English</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ms">Malay</option>
            </select>
            <p>{t(intro, { name: 'John', age: 30 })}</p>
            <p>{t(time, { time: '12:00:00' })}</p>
        </>
    )
}
```

### page2.tsx

```tsx
import { useT, d } from './locales'

// you can also define dicts in the same file as your components, it's up to you
const weather = d({
    en: 'The weather in {{city}} has {{humidity}}% humidity.',
    zh: '{{city}}的天气湿度为{{humidity}}%。',
    ja: '{{city}}の湿度は{{humidity}}%です。',
    ms: 'Cuaca di {{city}} mempunyai kelembapan {{humidity}}%.',
})<{ city: string; humidity: number }>

const lastLogin = d({
    en: 'Last login: {{date}} at {{time}}',
    zh: '上次登录：{{date}} {{time}}',
    ja: '最終ログイン：{{date}} {{time}}',
    ms: 'Log masuk terakhir: {{date}} pada {{time}}',
})<{ date: `${number}-${number}-${number}`; time: `${number}:${number}` }>

export const Page2 = () => {

    const { t } = useT()

    return (
        <>
            <p>{t(weather, { city: 'Kuala Lumpur', humidity: 80 })}</p>
            <p>{t(lastLogin, { date: '2024-04-24', time: '09:30' })}</p>
        </>
    )
}
```

## API

![how kotori works](image.webp) 

### `kotori(options)` (0.29kB)

Creates a scoped i18n instance.

```ts
import { kotori } from 'kotori'

export const { useT, d, setLanguage } = kotori({
    primary: 'en',
    secondaries: ['zh', 'ja', 'ms'],
})
```

| option | type | description |
| --- | --- | --- |
| `primary` | `BCP47LanguageTagWithSubtag` | The source language. Drives variable inference. |
| `secondaries` | `Exclude<BCP47LanguageTagWithSubtag, primary>[]` | Additional supported languages. Cannot include the primary language. |

Returns `{ d, useT, setLanguage, r }`.

### `d(translations)<argsType?>`

Defines a translation unit. Takes one string per language. Returns a `dictionary` object.

```ts
const time = d({ en: '{{hour}}:{{minute}}' })
```

By default, variables are typed as `string | number`. Pass a generic to narrow them:

```ts
const time = d({ en: '{{hour}}:{{minute}}' })<{
    hour: number
    minute: number
}>
```

### `setLanguage(tag)`

Updates the current language and rerenders all active `useT` consumers across all pages. Available directly on the `kotori` instance — useful for calling outside of React (route guards, axios interceptors, etc.).

```ts
setLanguage('zh')
```

### `r(dictionary, args?)`

Returns the translated string for the current language. `args` is required if the string has variables, omitted if it doesn't.

⚠️ Do not call this inside React components (it will break React Compiler optimization rules). Use this exclusively in raw JS/TS environments like router guards, API interceptors, or state utilities.

```tsx
r(intro, { name: 'John', age: 30 })
```

### `useT()`

React hook. Returns the current language tag as a reactive value. Updates when `setLanguage` is called. Returns `{ t, language }`.

```ts
const { t, language } = useT()
```

### `t(dictionary, args?)`

Returns the translated string for the current language. `args` is required if the string has variables, omitted if it doesn't.

React version of `r(dictionary, args?)`, works with React Compiler.

```tsx
const Intro = () => {
    const { t } = useT()

    return (
        <p>{t(intro, { name: 'John', age: 30 })}</p>
    )
}
```

### `detectLanguage(instance, options?)` (0.12kB with Kotori or 0.2kB standalone)

Detects the user's preferred language from browser settings and sets it on the kotori instance. Iterates through the user's full language preference list in order, stopping at the first match.

```ts
import { detectLanguage } from 'kotori'
import { kotori } from 'kotori'

const i18n = kotori({
    primary: 'en',
    secondaries: ['zh', 'ja', 'ms'],
})

detectLanguage(i18n)

export const { useT, d, setLanguage } = i18n
```

| option | type | default | description |
| --- | --- | --- | --- |
| `fallbackToSubtag` | `boolean` | `true` | If no exact match is found (e.g. `'zh-CN'`), fall back to the subtag (e.g. `'zh'`). |

```ts
// browser reports: ['zh-CN', 'en-US']
// declared languages: ['en', 'zh', 'ja', 'ms']

detectLanguage(i18n)
// 'zh-CN' → no exact match → subtag 'zh' → match → setLanguage('zh') ✅

detectLanguage(i18n, { fallbackToSubtag: false })
// 'zh-CN' → no exact match → 'en-US' → no exact match → no-op, stays 'en'
```

`detectLanguage` also works with non-kotori instances. Any object with a `setLanguage` callback and a `config` object satisfies the interface:

```ts
detectLanguage({
    setLanguage: (lang: 'en' | 'zh') => mySetLang(lang),
    config: { primary: 'en', secondaries: ['zh'] },
})
```

## Language Tags

kotori uses [BCP 47](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry) language tags. The type `BCP47LanguageTagWithSubtag` accepts both subtags (`en`, `zh`) and full tags (`en-US`, `zh-CN`), and is validated at the type level.

```ts
kotori({ primary: 'en', secondaries: ['zh', 'ms-MY'] })  // ✅
kotori({ primary: 'klingon', secondaries: ['zh'] })       // ❌ compile error
```

## Tips

- If you plan to add new languages frequently, consider colocating all your dicts in a single file or multiple files in one folder. It is easier to copy the entire files and hand it to an AI to translate.
- If your supported languages are fixed, consider splitting dicts by page or component. This keeps translations close to the code that uses them and makes them easier to maintain.
- For large or rarely used components, you can also reduce your bundle size by dynamically importing them only when they are needed on the page.

## Roadmap

- ✅ Auto detect locale from browser settings
- Auto persist language selection to localStorage
- Pluralization support
- Gender support
- Value formatting (date, number, currency)

## Trivial

There are already many i18n libraries, and the good names are mostly taken. The original plan was *kotoba* (言葉), the Japanese word for "words" — also taken. Claude suggested *kotori* as an alternative, and it stuck.

*Kotori* (小鳥) means "small bird" in Japanese. No deeper relevance to the library — it just sounds nice.