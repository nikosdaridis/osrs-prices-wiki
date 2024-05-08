module.exports = {
    content: ["./**/*.{razor,html}"],
    theme: {
        extend: {
            colors: {
                primary: "hsl(var(--color-primary) / <alpha-value>)",
                secondary: "hsl(var(--color-secondary) / <alpha-value>)",
                highlight: "hsl(var(--color-highlight) / <alpha-value>)",
                text: "hsl(var(--color-text) / <alpha-value>)",
            }
        },
        screens: {
            "2sm": "400px",
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
            "2xl": "1536px",
        },
    },
    plugins: [],
}
