<p align="center">
  <img src="logo.webp" alt="kotori i18n logo">
</p>

Strongly-typed, modular i18n for React. Variables are inferred directly from your strings — no codegen, no JSON, no schema files.

```ts
const { dict } = kotori({
    primaryLanguageTag: 'en',
    secondaryLanguageTags: ['zh', 'ja', 'ms'],
})

// ❌ TypeScript error: missing japanese translation
const intro = dict({ 
    // ⭐ base string drives the type contract
    en: 'Hello {{name}}, is it {{time}} now?', 

     // ❌ TypeScript error: missing key 'name' 
    zh: '你好，现在是 {{time}} 吗？',

    // ❌ TypeScript error: unknown key 'nam'      
    ms: 'Hai {{nam}}, adakah pukul {{time}} sekarang?'  

// optional: type your arguments, by default it's `Record<'name'|'time', string | number>` in this example
})<{name: string; time: `${number}:${number}`}> 


// ✅ Works
t('intro', { name: 'John', time: '12:25' }) 

// ❌ TypeScript error: missing { name }
t('intro', { time: '12:25' })

// ❌ TypeScript error: unknown key 'nama'                   
t('intro', { nama: 'John', time: '12:25' }) 

// ❌ TypeScript error: invalid format for 'time'
t('intro', { name: 'John', time: '12-00' }) 
```

- No codegen
- No JSON
- No dependencies
- No build step
- 0.33kb gzipped
- Modular and tree-shakeable
- Language change in one page rerenders all pages
- Variables typed and inferred from string literals — no more string typos
- maximum type safety with minimum types

Demo: <https://stackblitz.com/edit/vitejs-vite-nyxwmhre?file=src%2FApp.tsx>

## Installation

```bash
npm i kotori
```

## Quick Start

**utils.ts**

```ts
import { kotori } from './kotori'

export const { useT, dict, setLanguage } = kotori({
    primaryLanguageTag: 'en',
    secondaryLanguageTags: ['zh', 'ja', 'ms'],
})
```

**page1.tsx**

```tsx
import { useT, dict } from './utils'

const intro = dict({
    en: 'my name is {{name}}, I am {{age}} years old.',
    zh: '我叫{{name}}，我今年{{age}}岁了。',
    ja: '私の名前は{{name}}で、{{age}}歳です。',
    ms: 'nama saya {{name}}, saya berumur {{age}} tahun.',
})

const time = dict({
    en: 'time {{time}}',
    zh: '时间 {{time}}',
    ja: '時間 {{time}}',
    ms: 'waktu {{time}}',
// optional: type your arguments, by default it's `Record<'time', string | number>` in this example
})<{ time: `${number}:${number}:${number}` }> 

export const Page1 = () => {
    const { t, language, setLanguage } = useT()
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
            <p>{t('intro', { name: 'John', age: 30 })}</p>
            <p>{t('time', { time: '12:00:00' })}</p>
        </>
    )
}
```

**page2.tsx**

```tsx
import { useT, dict } from './utils'

const weather = dict({
    en: 'The weather in {{city}} has {{humidity}}% humidity.',
    zh: '{{city}}的天气湿度为{{humidity}}%。',
    ja: '{{city}}の湿度は{{humidity}}%です。',
    ms: 'Cuaca di {{city}} mempunyai kelembapan {{humidity}}%.',
})<{ city: string; humidity: number }>

const score = dict({
    en: 'Your score is {{score}} out of {{total}}.',
    zh: '你的得分是 {{total}} 分中的 {{score}} 分。',
    ja: 'あなたのスコアは {{total}} 点中 {{score}} 点です。',
    ms: 'Markah anda ialah {{score}} daripada {{total}}.',
})<{ score: number; total: number }>

const lastLogin = dict({
    en: 'Last login: {{date}} at {{time}}',
    zh: '上次登录：{{date}} {{time}}',
    ja: '最終ログイン：{{date}} {{time}}',
    ms: 'Log masuk terakhir: {{date}} pada {{time}}',
})<{ date: `${number}-${number}-${number}`; time: `${number}:${number}` }>

export const Page2 = () => {
    const { t, language, setLanguage } = useT()
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
            <p>{t(weather, { city: 'Kuala Lumpur', humidity: 80 })}</p>
            <p>{t(score, { score: 87, total: 100 })}</p>
            <p>{t(lastLogin, { date: '2024-04-24', time: '09:30' })}</p>
        </>
    )
}
```

## API

![how kotori works](image.webp) 

### `kotori(options)`

Creates a scoped i18n instance.

| option | type | description |
| --- | --- | --- |
| `primaryLanguageTag` | `AllTags` | The source language. Drives variable inference. |
| `secondaryLanguageTags` | `AllTags[]` | Additional supported languages. |

Returns `{ dict, useT, setLanguage }`.

### `dict(translations)<argsType?>`

Defines a translation unit. Takes one string per language. Optionally takes a generic to narrow the interpolated variable types.

By default, variables are typed as `string | number`. Pass a generic to narrow them:

```ts
const time = dict({ en: '{{hour}}:{{minute}}' })<{
    hour: number
    minute: number
}>
```

### `setLanguage(tag)`

Updates the current language and rerenders all active `useT` consumers across all pages. Available directly on the `kotori` instance — useful for calling outside of React (route guards, axios interceptors, etc.).

### `useT()`

React hook. Returns `{ t, language, setLanguage }`.

| return | type | description |
| --- | --- | --- |
| `t(dict, args?)` | `string` | Returns the translated string for the current language. `args` is required if the string has variables, omitted if it doesn't. |
| `language` | `primaryLanguageTag` \| `secondaryLanguageTags` | The current language tag as a reactive value. Updates when `setLanguage` is called. |
| `setLanguage(tag)` | `void` | Updates the language and rerenders all active `useT` consumers. |

## Language Tags

kotori uses [BCP 47](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry) language tags. Both subtags (`en`, `zh`) and full tags (`en-US`, `zh-Hans`) are accepted and validated at the type level.

## Roadmap

- Auto detect locale from browser settings
- Auto persist language selection to localStorage
- Pluralization support
- Gender support
- Value formatting (date, number, currency)

## Trivial

There are already a lot of i18n libraries, and the good names are mostly taken. The original plan was *kotoba* (言葉), the Japanese word for "words" — also taken. Claude suggested *kotori* as an alternative, and it stuck.

*Kotori* (小鳥) means "small bird" in Japanese. No deeper relevance to the library — it just sounds nice.

