import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import FloatingAssistant from "@/components/FloatingAssistant";
import Header from "@/components/Header";

export const metadata: Metadata = {
    title: "Careers | Join Our Team",
    description:
        "Explore exciting career opportunities and join our creative, fast-growing team. Apply today.",
    openGraph: {
        title: "Careers | Join Our Team",
        description: "Explore exciting career opportunities and apply today.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="scroll-smooth">
            <body className="antialiased">
                <LanguageProvider>
                    <Header />
                    {children}
                    <FloatingAssistant />
                </LanguageProvider>
            </body>
        </html>
    );
}
