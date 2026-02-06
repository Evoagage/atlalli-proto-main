import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atlalli',
  description: 'Place of Liquids',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We do NOT define lang here, because the child [locale] layout will do it
    <>
      <head>
        {/* Load Material Symbols for the BotNav icons */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      {children}
    </>
  );
}