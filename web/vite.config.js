import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Capture build-time git info so the running app can display it in the footer.
// Falls back cleanly when git isn't available (e.g., a container build from a tarball).
function gitInfo() {
	const safe = (cmd, fallback = '') => {
		try {
			return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
		} catch {
			return fallback;
		}
	};
	return {
		branch: safe('git rev-parse --abbrev-ref HEAD', 'unknown'),
		sha: safe('git rev-parse --short HEAD', 'unknown'),
		timestamp: new Date().toISOString()
	};
}

const info = gitInfo();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify({
			branch: info.branch,
			sha: info.sha,
			builtAt: info.timestamp
		})
	}
});
