/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lightBg: "#ffffff",
        darkBg: "#0a0a0a",

        redAccent: "rgba(204, 0, 0, 1)",
        textPrimary: "#05264e",
        textSecondary: "#667282",
        textTertiary: "#4f5e64",
        textMuted: "#a0abb8",
        textPlaceholder: "#808080",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        geistSans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        plusJakarta: ["Plus Jakarta Sans", "sans-serif"],
        sfCompact: ["SF Compact Text", "sans-serif"],
        productSans: ["Product Sans", "sans-serif"],
      },

      fontSize: {
        h1: "3.41rem", // 54.57px
        h2: "2.50rem", // 40px
        h3: "2.25rem", // 36px
        h4: "1.75rem", // 28px
        h5: "1.375rem", // 22px
        h6: "1.125rem", // 18px

        bodyLg: "1.28rem", // 20.46px
        body: "1rem", // 16px
        bodySm: "0.9375rem", // 15px
        bodyXs: "0.8125rem", // 13px

        cardTitle: "1.4375rem", // 23px
        jobTitle: "1.0625rem", // 17px
        priceLg: "3.5rem", // 56px
        priceMd: "1.3125rem", // 21px
        subtitle: "2.0625rem", // 33px
      },
    },
  },
  plugins: [],
};
