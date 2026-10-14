import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing the use of Resizer AI.',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-primary dark:text-white">
      <h1 className="text-3xl font-extrabold">Terms of Service</h1>
      <p className="mt-3 text-sm text-muted">These terms apply when you use Resizer AI.</p>

      <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
        <section>
          <h2 className="text-lg font-bold text-primary dark:text-white">Using the service</h2>
          <p>Use Resizer AI lawfully and do not disrupt, misuse, or attempt to gain unauthorized access to the service. You are responsible for ensuring you have the rights needed to use any files you process.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary dark:text-white">Your account</h2>
          <p>Keep your account credentials confidential and provide accurate account information. You are responsible for activity performed through your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary dark:text-white">Files and privacy</h2>
          <p>Image handling depends on the feature you choose. Review our <Link href="/privacy" className="text-blue-500 underline underline-offset-4">Privacy Policy</Link> for details about local processing, optional uploads, and account data.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary dark:text-white">Availability and changes</h2>
          <p>The service is provided on an as-available basis and may change over time. Keep your own copies of important files. We may update these terms when the service or applicable requirements change.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-primary dark:text-white">Contact</h2>
          <p>Questions about these terms can be sent to <a href="mailto:support@resizer-ai.com" className="text-blue-500 underline underline-offset-4">support@resizer-ai.com</a>.</p>
        </section>
      </div>
    </main>
  );
}