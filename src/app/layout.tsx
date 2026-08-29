import type { Metadata } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "JinGa Explorers Academy Festival 2026 | Festival TK/RA Se-Kabupaten Purwakarta",
  description: "Festival Akademik, Kreatif, dan Islami untuk TK/RA se-Kabupaten Purwakarta. Diselenggarakan oleh SD Plus 3 Al-Muhajirin. Jelajah Ilmu, Amal, dan Akhlak Mulia!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${fredoka.variable} ${jakarta.variable} scroll-smooth`}
    >
      <head>
        <link rel="icon" href="/assets/hero-poster.png" type="image/png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden bg-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}
