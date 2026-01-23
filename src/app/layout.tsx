import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3D Scene Generator',
  description: 'Generate composed 3D scene images from text prompts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
