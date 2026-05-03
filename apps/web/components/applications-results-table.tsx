import type { JobApplication } from '../lib/types';
import type { ReactNode } from 'react';

const statusClass: Record<string, string> = {
  Applied: 'bg-[#E3F2FD] text-[#1565C0]',
  Saved: 'bg-[#E8EAF6] text-[#283593]',
  Shortlisted: 'bg-[#FFF9C4] text-[#F57F17]',
  Rejected: 'bg-[#FFCDD2] text-[#B71C1C]',
  Accepted: 'bg-[#C8E6C9] text-[#1B5E20]',
  'In Progress': 'bg-[#FFE0B2] text-[#E65100]',
  Interview: 'bg-[#FFF9C4] text-[#F57F17]',
  Offer: 'bg-[#C8E6C9] text-[#1B5E20]',
  Unknown: 'bg-surface-container text-on-surface-variant',
};

export function ApplicationsResultsTable({
  rows,
  emptyText,
  renderStatus,
}: {
  rows: JobApplication[];
  emptyText: string;
  renderStatus?: (app: JobApplication) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-5 py-3">Job Title</th>
            <th className="px-5 py-3">Company</th>
            <th className="px-5 py-3">Role Type</th>
            <th className="px-5 py-3">Portal</th>
            <th className="px-5 py-3">Applied Date</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.length ? (
            rows.map((app) => (
              <tr key={app.id} className="border-t border-outline-variant/20">
                <td className="px-5 py-4 font-medium text-on-surface">{app.job_title}</td>
                <td className="px-5 py-4">{app.company}</td>
                <td className="px-5 py-4">{app.role_type}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-surface-container px-3 py-1 font-semibold">
                    {app.portal}
                  </span>
                </td>
                <td className="px-5 py-4">{new Date(app.applied_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  {renderStatus ? (
                    renderStatus(app)
                  ) : (
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusClass[app.status]}`}>
                      {app.status}
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-5 py-8 text-center text-on-surface-variant" colSpan={6}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
