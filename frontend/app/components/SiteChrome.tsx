'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor = pathname === '/tools';

  return (
    <>
      {!isEditor && <Navbar />}
      <main className={`flex-1 ${isEditor ? '' : 'pt-16'}`}>{children}</main>
      {!isEditor && <Footer />}
    </>
  );
}