/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Atlalli Brand Colors (from Brand_Assets.md)
                'obsidian-night': '#0D0D0D',
                'liquid-gold': '#D4AF37',
                'agave-blue': '#72C7E7',
                'bone-white': '#F5F5F2',
                'standard-jade': '#00A86B',
                'premium-amber': '#FFBF00',
                'error-red': '#C53030',
                // Tier-specific colors
                'terracotta-orange': '#A0522D',
                'jade-green': '#00A86B',
                'agave-premium': '#72C7E7',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
                heading: ['var(--font-tenor-sans)', 'Tenor Sans', 'Montserrat', 'sans-serif'],
                mono: ['monospace'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'gold-glow': '0 0 15px rgba(212, 175, 55, 0.3)',
                'amber-pulse': '0 0 20px rgba(255, 191, 0, 0.5)',
            },
            keyframes: {
                'progress-indeterminate': {
                    '0%': { transform: 'translateX(-100%) scaleX(0.2)' },
                    '50%': { transform: 'translateX(0%) scaleX(0.5)' },
                    '100%': { transform: 'translateX(100%) scaleX(0.2)' },
                },
            },
            animation: {
                'progress-indeterminate': 'progress-indeterminate 1.5s infinite linear',
            },
        },
    },
    plugins: [],
}
