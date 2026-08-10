import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Candidate chooses a submission method before opening the dedicated workspace', async () => {
  const [page, editor] = await Promise.all([
    read('../app/candidate/challenges/[id]/submit/page.tsx'),
    read('../components/submissions/TextSubmissionEditor.tsx'),
  ]);

  assert.match(page, /Bạn muốn nộp bài theo cách nào/);
  assert.match(page, /submissionMethod === 'TEXT'/);
  assert.match(page, /challengeAPI\.getById/);
  assert.match(page, /Yêu cầu thử thách/);
  assert.match(page, /Tiêu chí đánh giá/);
  assert.match(editor, /Công cụ Markdown/);
  assert.match(editor, /Xem trước/);
  assert.match(editor, /ReactMarkdown/);
  assert.doesNotMatch(editor, /className="prose/);
});
