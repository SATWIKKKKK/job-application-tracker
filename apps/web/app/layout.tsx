import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { GsapProvider } from '../components/gsap-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'JobTrackr',
  description: 'Track every job application automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} font-body antialiased`}>
        <GsapProvider>
          <div data-page-transition>{children}</div>
        </GsapProvider>
      </body>
    </html>
  );
}
