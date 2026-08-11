'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export type TextSubmissionFormat = 'RICH_TEXT' | 'MARKDOWN';

interface TextSubmissionEditorProps {
  disabled?: boolean;
  error?: string | null;
  onSubmit: (payload: { content: string; contentFormat: TextSubmissionFormat }) => Promise<void>;
}

const MIN_LENGTH = 50;
const MAX_LENGTH = 50_000;

const richTextActions: Array<{
  label: string;
  title: string;
  command: string;
  className?: string;
}> = [
  { label: 'B', title: 'In đậm', command: 'bold', className: 'font-bold' },
  { label: 'I', title: 'In nghiêng', command: 'italic', className: 'italic' },
  { label: 'U', title: 'Gạch chân', command: 'underline', className: 'underline' },
  { label: '• Danh sách', title: 'Danh sách', command: 'insertUnorderedList' },
];

const markdownActions = [
  { label: 'H1', title: 'Tiêu đề', before: '# ', after: '', text: 'Tiêu đề' },
  { label: 'B', title: 'In đậm', before: '**', after: '**', text: 'văn bản' },
  { label: 'I', title: 'In nghiêng', before: '_', after: '_', text: 'văn bản' },
  { label: '•', title: 'Danh sách', before: '- ', after: '', text: 'mục danh sách' },
  { label: '❝', title: 'Trích dẫn', before: '> ', after: '', text: 'trích dẫn' },
  { label: '</>', title: 'Khối mã', before: '```\n', after: '\n```', text: 'code' },
  { label: '↗', title: 'Liên kết', before: '[', after: '](https://)', text: 'liên kết' },
] as const;

export function TextSubmissionEditor({ disabled, error, onSubmit }: TextSubmissionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const [format, setFormat] = useState<TextSubmissionFormat>('RICH_TEXT');
  const [markdownView, setMarkdownView] = useState<'WRITE' | 'PREVIEW'>('WRITE');
  const [richText, setRichText] = useState('');
  const [richTextLength, setRichTextLength] = useState(0);
  const [markdown, setMarkdown] = useState('');

  const content = format === 'RICH_TEXT' ? richText : markdown;
  const characterCount = format === 'RICH_TEXT' ? richTextLength : markdown.trim().length;
  const isValid = characterCount >= MIN_LENGTH && characterCount <= MAX_LENGTH;

  useEffect(() => {
    if (format === 'RICH_TEXT' && editorRef.current?.innerHTML !== richText) {
      editorRef.current!.innerHTML = richText;
    }
    // Restore the editor DOM only when returning from Markdown mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  const applyRichText = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);
    setRichText(editorRef.current?.innerHTML ?? '');
  };

  const applyMarkdown = (before: string, after: string, placeholder: string) => {
    const textarea = markdownRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.slice(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;
    setMarkdown(`${markdown.slice(0, start)}${replacement}${markdown.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid || disabled) return;
    await onSubmit({ content, contentFormat: format });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-border-secondary bg-background-secondary shadow-xl shadow-black/10"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Bài làm của bạn</h2>
          <p className="mt-1 text-xs leading-5 text-foreground-secondary">
            Chọn trình soạn thảo trực quan hoặc Markdown. Nội dung của mỗi chế độ được giữ riêng.
          </p>
        </div>
        <div
          className="flex rounded-lg border border-border-secondary bg-background p-1"
          role="tablist"
          aria-label="Định dạng bài viết"
        >
          {(
            [
              ['RICH_TEXT', 'Soạn thảo'],
              ['MARKDOWN', 'Markdown'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={format === value}
              onClick={() => setFormat(value)}
              className={cn(
                'rounded-md px-4 py-2 text-xs font-semibold transition-colors',
                format === value
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {format === 'RICH_TEXT' ? (
        <div>
          <div
            className="flex flex-wrap gap-1 border-b border-border bg-background px-4 py-2"
            aria-label="Công cụ định dạng"
          >
            {richTextActions.map((action) => (
              <button
                key={action.command}
                type="button"
                title={action.title}
                aria-label={action.title}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyRichText(action.command)}
                disabled={disabled}
                className={cn(
                  'min-h-9 rounded-md border border-transparent px-3 text-xs text-foreground-secondary transition-colors hover:border-border-secondary hover:bg-background-tertiary hover:text-foreground disabled:opacity-50',
                  action.className
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
          <div
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Nội dung bài làm"
            data-placeholder="Bắt đầu trình bày giải pháp của bạn..."
            onInput={(event) => {
              const target = event.currentTarget;
              setRichText(target.innerHTML);
              setRichTextLength((target.innerText ?? '').trim().length);
            }}
            className="min-h-[520px] bg-white px-8 py-7 text-base leading-8 text-slate-900 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] focus:ring-2 focus:ring-inset focus:ring-accent/40"
          />
        </div>
      ) : (
        <div className="min-h-[520px]">
          <div className="flex flex-col gap-2 border-b border-border bg-background px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1" aria-label="Công cụ Markdown">
              {markdownActions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  title={action.title}
                  aria-label={action.title}
                  onClick={() => applyMarkdown(action.before, action.after, action.text)}
                  disabled={disabled || markdownView !== 'WRITE'}
                  className="min-h-9 min-w-9 rounded-md border border-transparent px-2.5 text-xs font-semibold text-foreground-secondary transition-colors hover:border-border-secondary hover:bg-background-tertiary hover:text-foreground disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div
              className="flex rounded-lg border border-border-secondary bg-background-secondary p-1"
              role="tablist"
              aria-label="Chế độ Markdown"
            >
              {(
                [
                  ['WRITE', 'Viết'],
                  ['PREVIEW', 'Xem trước'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={markdownView === value}
                  onClick={() => setMarkdownView(value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    markdownView === value
                      ? 'bg-accent text-white'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {markdownView === 'WRITE' ? (
            <textarea
              ref={markdownRef}
              value={markdown}
              disabled={disabled}
              maxLength={MAX_LENGTH}
              onChange={(event) => setMarkdown(event.target.value)}
              placeholder="# Tiêu đề giải pháp&#10;&#10;Trình bày cách tiếp cận của bạn..."
              aria-label="Nội dung Markdown"
              className="min-h-[480px] w-full resize-none bg-slate-950 px-6 py-6 font-mono text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-accent/50"
            />
          ) : (
            <article className="min-h-[480px] bg-white px-7 py-7 text-[15px] leading-7 text-slate-800 sm:px-10 [&_a]:text-teal-700 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:bg-teal-50 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-5 [&_pre]:text-slate-100">
              {markdown.trim() ? (
                <ReactMarkdown>{markdown}</ReactMarkdown>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center text-center text-slate-400">
                  Viết nội dung Markdown rồi chọn “Xem trước” để xem bản trình bày hoàn chỉnh.
                </div>
              )}
            </article>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          <p
            className={cn(
              'text-xs font-medium',
              isValid ? 'text-success' : 'text-foreground-secondary'
            )}
          >
            {characterCount.toLocaleString('vi-VN')} / {MAX_LENGTH.toLocaleString('vi-VN')} ký tự
          </p>
          <p className="mt-1 text-2xs text-foreground-tertiary">
            Cần ít nhất {MIN_LENGTH} ký tự để nộp bài.
          </p>
        </div>
        <Button type="submit" variant="primary" size="lg" disabled={disabled || !isValid}>
          {disabled ? 'Đang gửi bài...' : 'Nộp bài viết'}
        </Button>
      </div>

      {error && (
        <div
          className="border-t border-error/30 bg-error-bg px-5 py-3 text-sm text-error"
          role="alert"
        >
          <strong>Chưa thể nộp bài.</strong> {error}
        </div>
      )}
    </form>
  );
}
