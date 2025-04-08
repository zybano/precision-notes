
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: '#e2e8f0',
				input: '#e2e8f0',
				ring: '#5768fd',
				background: '#fafbff',
				foreground: '#040523',
				primary: {
					DEFAULT: '#040523',
					foreground: '#fafbff'
				},
				secondary: {
					DEFAULT: '#5768fd',
					foreground: '#fafbff'
				},
				destructive: {
					DEFAULT: '#ff4747',
					foreground: '#fafbff'
				},
				muted: {
					DEFAULT: '#f1f5f9',
					foreground: '#475569'
				},
				accent: {
					DEFAULT: '#ffcd6a',
					foreground: '#040523'
				},
				popover: {
					DEFAULT: '#fafbff',
					foreground: '#040523'
				},
				card: {
					DEFAULT: '#fafbff',
					foreground: '#040523'
				},
				sidebar: {
					DEFAULT: '#fafbff',
					foreground: '#040523',
					primary: '#040523',
					'primary-foreground': '#fafbff',
					accent: '#ffcd6a',
					'accent-foreground': '#040523',
					border: '#e2e8f0',
					ring: '#5768fd'
				},
				// Update the color palettes to use our brand colors
				'medical': {
					50: '#eef0ff',
					100: '#e0e4ff',
					200: '#c7cdff',
					300: '#a2acfe',
					400: '#7c8afd',
					500: '#5768fd',
					600: '#4351f5',
					700: '#3340e2',
					800: '#2b36b7',
					900: '#29348f',
					950: '#040523',
				},
				// Yellow palette (replacing the neon green "sunshine" palette)
				'sunshine': {
					50: '#fff9e6',
					100: '#fff3cc',
					200: '#ffea99',
					300: '#ffdf66',
					400: '#ffd633',
					500: '#ffcd6a',
					600: '#e6b700',
					700: '#cc9900',
					800: '#b38600',
					900: '#997300',
					950: '#806000',
				}
			},
			borderRadius: {
				lg: '0.5rem',
				md: '0.375rem',
				sm: '0.25rem'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'smooth-appear': {
					'0%': { opacity: '0', transform: 'scale(0.98)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'pulse-glow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-up': 'fade-up 0.5s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'smooth-appear': 'smooth-appear 0.4s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
