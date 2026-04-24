import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['src/index.ts'],
	clean: true,
	minify: !false,
	format: ['cjs', 'esm'],
	outDir: 'dist',
	dts: true,
	target: false,
})
