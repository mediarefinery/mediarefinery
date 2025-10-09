/** @type {import('next').NextConfig} */
const path = require('path')

module.exports = {
	reactStrictMode: true,
	// Serve this Next app under the /dashboard base path so client fetches
	// to /dashboard/api/* resolve correctly in local dev and production.
	basePath: '/dashboard',
	// Allow importing and transpiling workspace packages / files outside the dashboard
	// This is useful for a monorepo where shared code lives at the repo root (e.g. src/)
	transpilePackages: ['mediarefinery'],
	experimental: {
		// enable resolving files from the parent workspace root
		externalDir: true,
	},
}