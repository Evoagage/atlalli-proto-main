const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    //turbopack: {
    //    // Leave empty or add custom rules here
    //},
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
    allowedDevOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://192.168.0.14:3000.dev',
        'https://192.168.0.14:3000.dev',
    ],
}

module.exports = withNextIntl(nextConfig)
