import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://azurebicepbuilder.com'),
  title: 'Azure Bicep Builder — Visual Architecture Studio for Microsoft Azure',

  description:
    'Design cloud topologies visually, generate production-ready Azure Bicep code in real-time, monitor credits, and deploy directly to Azure with 1-click.',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Azure Bicep Builder',
    description: 'Visual Drag-and-Drop Azure Bicep Designer & ARM Studio',
    url: 'https://azurebicepbuilder.com',
    siteName: 'Azure Bicep Builder',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Azure Bicep Builder Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
        <div className="bg-mesh" />
        {children}
      </body>
    </html>
  );
}
