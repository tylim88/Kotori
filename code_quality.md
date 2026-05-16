v5.0.4 Code quality rated by Sonnet 4.6 on 17th May 2026

**Overall: 8.5/10**

---

**API Design — 9/10**

The final API is genuinely elegant:

```ts
const { t, setLanguage, useT } = kotori({...})
const intro = dict({...})
t(intro, { name: 'John' })
```

- Zero config to get started
- `dict` is pure data, no side effects
- `t` is a plain function, callable anywhere including outside React
- `useT` is the only React-specific surface — clean separation
- The double-call `dict({})()` is the only wart, and it's a TypeScript constraint not a design choice

---

**Type System — 10/10**

This is the strongest part of the codebase:

- `ExtractVariables` + `Trim` — correct and elegant
- Variadic args trick to make args disappear when no variables — clever
- Symbol phantom type for `_args` — proper encapsulation
- Variable mismatch detection across languages — genuinely novel
- BCP 47 validation — right call

No mainstream i18n library does all of this without codegen.

---

**Code Quality — 8/10**

```ts
// clean — closure-based state, no classes, no global
let language = props.primaryLanguageTag as WorkingTags
const listeners = new Set<() => void>()
```

The closure architecture is correct and idiomatic. `subscribe` extracted cleanly. `setLanguage` is pure — updates state, notifies listeners, nothing else.

Small deductions:
- `dict().translation[language]` calls `dict()` on every `t` call — the dict callback is invoked every translation. Fine for now but worth noting.

---

**Code Entropy — 8/10**

The codebase has gotten progressively cleaner with each iteration. Comparing first version to now:

| | v0.0 | now |
|---|---|---|
| Lines | ~120 | ~110 |
| Concepts | createTranslations, snapshot map, refCount, symbols | just closure + listeners |
| Mental model | register → hook → t | kotori → dict → t |

The entropy reduction is real. Option C eliminated an entire layer of indirection.

Minor remaining entropy — the `dict` generic constraint block is dense and hard to read at a glance, but that's unavoidable given what it's doing.

---

**Readability — 8/10**

The runtime code is very readable. The type-level code is necessarily complex but well-structured. `subscribe` being named and extracted rather than inlined helps.

What would push it higher — a few more comments at the type level explaining *why*, not just *what*:

```ts
// extract variable names from string literals e.g. 'Hello {{name}}' → 'name'
type ExtractVariables<T extends string> = ...

// phantom type — carries arg type information without appearing at runtime
declare const _args: unique symbol
```

---

**Summary**

The codebase punches well above its weight for 110 lines. The type system work alone would be impressive in a 500-line library. The main gap is the type-level code lacks explanatory comments, which will matter when contributors or your future self revisit it.