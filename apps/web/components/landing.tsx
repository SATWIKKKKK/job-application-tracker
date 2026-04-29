import { ArrowRight, CheckCircle2, ExternalLink, FileText, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-40 pt-32 text-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#D6E2FF] px-5 py-2 text-lg">
        <CheckCircle2 size={20} />
        Track Every Application, Zero Effort
      </div>
      <h1 className="mt-12 max-w-4xl font-headline text-5xl font-extrabold leading-tight text-[#171B22] md:text-6xl">
        Never Lose Track of a Job Application Again
      </h1>
      <p className="mt-8 max-w-5xl text-2xl leading-9 text-on-surface">
        Connect your job portals, install our browser extension, and every application you submit
        auto-logs to your personal Google Sheet.
      </p>
      <div className="mt-16 flex flex-col gap-5 sm:flex-row">
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-10 py-4 text-xl font-bold text-white"
        >
          Get Started Free <ArrowRight />
        </Link>
        <button className="inline-flex items-center justify-center gap-3 rounded-full border border-outline-variant px-10 py-4 text-xl font-bold">
          <PlayCircle /> Watch Demo
        </button>
      </div>
      <div className="mt-32 w-full max-w-[1440px] overflow-hidden rounded-xl border border-outline-variant bg-white text-left shadow-sm">
        <div className="flex items-center gap-5 border-b border-outline-variant bg-[#F2F4FB] px-5 py-4">
          <div className="flex gap-2">
            <span className="h-4 w-4 rounded-full bg-red-300" />
            <span className="h-4 w-4 rounded-full bg-blue-200" />
            <span className="h-4 w-4 rounded-full bg-indigo-100" />
          </div>
          <div className="flex flex-1 items-center gap-3 rounded bg-[#E9EBF4] px-5 py-3 text-xl text-on-surface">
            <FileText size={20} /> JobTrackr Auto-Log Sheet
          </div>
        </div>
        <div className="overflow-x-auto p-8">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-outline-variant text-sm uppercase tracking-widest">
                {['Job Title', 'Company', 'Date Applied', 'Status', 'Action'].map((head) => (
                  <th className="px-5 py-5 text-left font-bold" key={head}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-lg">
              {[
                ['Senior Frontend Engineer', 'TechFlow Inc.', 'Oct 24, 2023', 'Applied'],
                ['Product Designer', 'DesignOps Co', 'Oct 22, 2023', 'Interviewing'],
                ['Full Stack Developer', 'StartupX', 'Oct 20, 2023', 'Rejected'],
              ].map((row) => (
                <tr className="border-b border-outline-variant last:border-0" key={row[0]}>
                  <td className="px-5 py-7 font-bold">{row[0]}</td>
                  <td className="px-5 py-7">{row[1]}</td>
                  <td className="px-5 py-7">{row[2]}</td>
                  <td className="px-5 py-7">
                    <span className="rounded-full bg-[#D6E2FF] px-4 py-2 text-sm">{row[3]}</span>
                  </td>
                  <td className="px-5 py-7 text-right text-outline-variant">
                    <ExternalLink />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
