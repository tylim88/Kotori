import { memo, StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { kotori } from '.'

const { useTranslations, dict, setLanguage } = kotori({
	primaryLanguageTag: 'en',
	secondaryLanguageTags: ['zh', 'ja', 'ms'],
})

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
})<{ time: `${number}:${number}:${number}` }>

const Page1 = () => {
	const { t, setLanguage, language } = useTranslations({
		intro,
		time,
	})
	return (
		<>
			<p>Page 1</p>
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

export const Page2 = memo(({ index }: { index: number }) => {
	const { t, setLanguage, language } = useTranslations(
		{
			weather,
			score,
			lastLogin,
		},
		'page2',
	)
	return (
		<>
			<p>Page 2</p>
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
			<p>
				{t('weather', {
					city: 'Kuala Lumpur',
					humidity: 80,
				})}
			</p>
			<p>{t('score', { score: 87, total: 100 })}</p>
			<p>{t('lastLogin', { date: '2024-04-24', time: '09:30' })}</p>
		</>
	)
})
const App = () => {
	const [number, setNumber] = useState(2)
	return (
		<>
			<Page1 />
			<div>
				<button type="button" onClick={() => setNumber((n) => n + 1)}>
					mount page2
				</button>
				<button type="button" onClick={() => setNumber((n) => n - 1)}>
					unmount page2
				</button>
			</div>
			{[...Array(number)].map((_, i) => (
				<Page2 key={i} index={i} />
			))}
		</>
	)
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
