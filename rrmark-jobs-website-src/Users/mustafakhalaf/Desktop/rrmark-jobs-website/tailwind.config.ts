import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                // San Francisco (SF Pro) — Apple system font
                sans: [
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "SF Pro Text",
                    "SF Pro Display",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
                // SF Arabic — Apple's Arabic system font
                arabic: [
                    "SF Arabic",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Helvetica Neue",
                    "Arial",
                    "sans-serif",
                ],
            },
            backdropBlur: {
                xs: "2px",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px) scale(1)" },
                    "50%": { transform: "translateY(-30px) scale(1.05)" },
                },
                floatReverse: {
                    "0%, 100%": { transform: "translateY(0px) scale(1)" },
                    "50%": { transform: "translateY(30px) scale(0.95)" },
                },
                fadeInUp: {
                    from: { opacity: "0", transform: "translateY(20px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                ripple: {
                    "0%": { width: "0px", height: "0px", opacity: "0.6" },
                    "100%": { width: "500px", height: "500px", opacity: "0" },
                },
                gradientX: {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                }
            },
            animation: {
                float: "float 8s ease-in-out infinite",
                "float-reverse": "floatReverse 10s ease-in-out infinite",
                "float-slow": "float 14s ease-in-out infinite",
                "fade-in-up": "fadeInUp 0.5s ease-out forwards",
                shimmer: "shimmer 2s linear infinite",
                ripple: "ripple 0.6s linear forwards",
                "gradient-x": "gradientX 6s ease infinite",
            },
            backgroundImage: {
                "glass-gradient":
                    "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
            },
            boxShadow: {
                glass: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
                "glass-hover":
                    "0 16px 48px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
                glow: "0 0 40px rgba(139,92,246,0.15)",
                "glow-blue": "0 0 40px rgba(59,130,246,0.15)",
            },
        },
    },
    plugins: [],
};

export default config;
