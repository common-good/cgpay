import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// adapter-node builds a self-contained Node server we can run anywhere with `node build`.
		// Works on a generic VPS (e.g. demo.commongood.earth's host), Render, Fly, Railway, etc.
		adapter: adapter()
	}
};

export default config;
