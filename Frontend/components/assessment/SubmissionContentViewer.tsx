import ReactMarkdown from 'react-markdown';
import type { SubmissionContentFormat } from '@/lib/types';

interface SubmissionContentViewerProps {
  content?: string | null;
  format?: SubmissionContentFormat | null;
}

const articleStyles =
  'h-full overflow-y-auto bg-white px-6 py-7 text-[15px] leading-7 text-slate-800 sm:px-10 [&_a]:text-teal-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-100';

export function SubmissionContentViewer({ content, format }: SubmissionContentViewerProps) {
  if (!content) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border-secondary bg-background-secondary p-8 text-center text-sm text-foreground-secondary">
        Không có nội dung bài viết để hiển thị.
      </div>
    );
  }

  return (
    <div className="h-full min-h-[420px] overflow-hidden rounded-xl border border-border-secondary shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-border bg-background-secondary px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
          Bài viết của ứng viên
        </span>
        <span className="rounded-full border border-accent/30 bg-accent-bg px-3 py-1 text-2xs font-semibold text-accent">
          {format === 'Markdown' ? 'Markdown' : 'Soạn thảo trực tiếp'}
        </span>
      </div>
      {format === 'Markdown' ? (
        <article className={articleStyles}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      ) : (
        <article className={articleStyles} dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
}
