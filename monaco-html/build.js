/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const alias = require('esbuild-plugin-alias');
const path = require('path');
const { removeDir, tsc, dts, build } = require('../build/utils');

removeDir(`monaco-html/release`);
removeDir(`monaco-html/out`);

tsc(`monaco-html/src/tsconfig.json`);

dts(
	`monaco-html/out/amd/monaco.contribution.d.ts`,
	`monaco-html/monaco.d.ts`,
	'monaco.languages.html'
);

build({
	entryPoints: ['src/monaco.contribution.ts', 'src/htmlMode.ts', 'src/html.worker.ts'],
	bundle: true,
	target: 'esnext',
	format: 'esm',
	define: {
		AMD: false
	},
	external: ['monaco-editor-core', '*/htmlMode'],
	outdir: 'release/esm/',
	plugins: [
		alias({
			'vscode-nls': path.join(__dirname, 'src/fillers/vscode-nls.ts')
		})
	]
});

/**
 * @param {'dev'|'min'} type
 * @param {string} entryPoint
 * @param {string} banner
 */
function buildOneAMD(type, entryPoint, banner) {
	/** @type {import('esbuild').BuildOptions} */
	const options = {
		entryPoints: [entryPoint],
		bundle: true,
		target: 'esnext',
		format: 'iife',
		define: {
			AMD: true
		},
		external: ['*/htmlMode'],
		globalName: 'moduleExports',
		banner: {
			js: banner
		},
		footer: {
			js: 'return moduleExports;\n});'
		},
		outdir: `release/${type}/`,
		plugins: [
			alias({
				'vscode-nls': path.join(__dirname, 'src/fillers/vscode-nls.ts'),
				'monaco-editor-core': path.join(__dirname, 'src/fillers/monaco-editor-core-amd.ts')
			})
		]
	};
	if (type === 'min') {
		options.minify = true;
	}
	build(options);
}

/**
 * @param {string} entryPoint
 * @param {string} banner
 */
function buildAMD(entryPoint, banner) {
	buildOneAMD('dev', entryPoint, banner);
	buildOneAMD('min', entryPoint, banner);
}

buildAMD(
	'src/monaco.contribution.ts',
	'define("vs/language/html/monaco.contribution",["vs/editor/editor.api"],()=>{'
);
buildAMD('src/htmlMode.ts', 'define("vs/language/html/htmlMode",["vs/editor/editor.api"],()=>{');
buildAMD('src/htmlWorker.ts', 'define("vs/language/html/htmlWorker",[],()=>{');
