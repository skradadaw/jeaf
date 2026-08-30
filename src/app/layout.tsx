import type { Metadata } from "next";
import { Fredoka, Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
      className={`${fredoka.variable} ${jakarta.variable} ${inter.variable} scroll-smooth`}
    >
      <head>
        <link rel="icon" href="/assets/logo.png" type="image/png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden bg-[#F8FAFC]">
        <Toaster position="top-center" toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#fff',
            color: '#334155',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }
        }} />
        {children}
      </body>
    </html>
  );
}
