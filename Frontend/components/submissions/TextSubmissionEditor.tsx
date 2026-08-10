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

const toolbarActions: Array<{
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

export function TextSubmissionEditor({ disabled, error, onSubmit }: TextSubmissionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<TextSubmissionFormat>('RICH_TEXT');
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

  const applyFormat = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);
    setRichText(editorRef.current?.innerHTML ?? '');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid || disabled) return;
    await onSubmit({ content, contentFormat: format });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-border-secondary bg-background-secondary shadow-xl shadow-black/10"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Không gian viết bài</h2>
          <p className="mt-1 text-xs leading-5 text-foreground-secondary">
            Chọn cách soạn thảo phù hợp. Nội dung được giữ nguyên khi chuyển qua lại giữa hai chế
            độ.
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
            {toolbarActions.map((action) => (
              <button
                key={action.command}
                type="button"
                title={action.title}
                aria-label={action.title}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyFormat(action.command)}
                className={cn(
                  'min-h-9 rounded-md border border-transparent px-3 text-xs text-foreground-secondary transition-colors hover:border-border-secondary hover:bg-background-tertiary hover:text-foreground',
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
            className="min-h-[430px] bg-white px-8 py-7 text-base leading-8 text-slate-900 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] focus:ring-2 focus:ring-inset focus:ring-accent/40"
          />
        </div>
      ) : (
        <div className="grid min-h-[430px] md:grid-cols-2">
          <div className="flex min-h-[430px] flex-col border-b border-border md:border-b-0 md:border-r">
            <div className="border-b border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
              Markdown
            </div>
            <textarea
              value={markdown}
              disabled={disabled}
              maxLength={MAX_LENGTH}
              onChange={(event) => setMarkdown(event.target.value)}
              placeholder="# Tiêu đề giải pháp&#10;&#10;Trình bày cách tiếp cận của bạn..."
              aria-label="Nội dung Markdown"
              className="min-h-[390px] flex-1 resize-none bg-background p-5 font-mono text-sm leading-7 text-foreground outline-none focus:ring-2 focus:ring-inset focus:ring-accent/40"
            />
          </div>
          <div className="flex min-h-[430px] flex-col bg-white text-slate-900">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Xem trước
            </div>
            <article className="prose max-w-none flex-1 overflow-y-auto p-5 text-sm leading-7">
              {markdown.trim() ? (
                <ReactMarkdown>{markdown}</ReactMarkdown>
              ) : (
                <p className="text-slate-400">Bản xem trước sẽ xuất hiện tại đây.</p>
              )}
            </article>
          </div>
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
