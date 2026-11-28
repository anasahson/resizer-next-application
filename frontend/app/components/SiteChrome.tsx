'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isToolsPage = pathname === '/tools';
  const isImmersiveEditor = isToolsPage && !searchParams.has('tool') && !searchParams.has('preset');

  return (
    <>
      {!isImmersiveEditor && <Navbar />}
      <main className={`flex-1 ${isImmersiveEditor ? '' : 'pt-16'}`}>{children}</main>
      {!isToolsPage && <Footer />}
    </>
  );
}