import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metrologia",
  description: "Sistema de gestão de conformidade e calibração."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var storedTheme = window.localStorage.getItem("metrologia-theme");
              var theme = storedTheme === "dark" ? "dark" : "light";
              var storedFontScale = window.localStorage.getItem("metrologia-font-scale");
              var fontScale =
                storedFontScale === "sm" || storedFontScale === "lg" ? storedFontScale : "md";
              document.documentElement.dataset.theme = theme;
              document.documentElement.dataset.fontScale = fontScale;
              document.documentElement.style.colorScheme = theme;
            } catch (error) {
              document.documentElement.dataset.theme = "light";
              document.documentElement.dataset.fontScale = "md";
              document.documentElement.style.colorScheme = "light";
            }
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
