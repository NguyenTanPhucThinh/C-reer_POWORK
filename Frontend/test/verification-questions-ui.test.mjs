import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Essay questions are immutable and answers accept typing without clipboard shortcuts', async () => {
  const page = await readFile(
    new URL('../app/candidate/my-submissions/[id]/verification/page.tsx', import.meta.url),
    'utf8'
  );

  const oralConfirmation = page.slice(
    page.indexOf('async function confirmOralCompleted'),
    page.indexOf('async function startExistingRecording')
  );
  assert.ok(
    oralConfirmation.indexOf('await sendOralCompleted') <
      oralConfirmation.indexOf('await loadQuestions')
  );
  assert.match(page, /questionsLoadedId\.current === verificationId/);
  assert.match(page, /questionRequest\.current\?\.id === verificationId/);
  assert.match(page, /generateVerificationQuestions\(verificationId\)/);
  assert.match(page, /QUESTIONS_LOADING/);
  assert.match(page, /QUESTIONS_FAILED/);
  assert.match(page, /Thử tải lại bộ câu hỏi/);
  assert.doesNotMatch(page, /regenerate/i);

  for (const event of ['PASTE_BLOCKED', 'COPY_BLOCKED', 'DROP_BLOCKED', 'SELECT_ALL_BLOCKED']) {
    assert.match(page, new RegExp(`'${event}'`));
  }
  assert.match(page, /event\.preventDefault\(\)/);
  assert.match(page, /event\.ctrlKey \|\| event\.metaKey/);
  assert.match(page, /event\.key\.toLowerCase\(\) === 'a'/);
  assert.match(page, /inputType === 'insertFromPaste'/);
  assert.match(page, /inputType === 'insertFromDrop'/);
  assert.doesNotMatch(page, /clipboardData|readText|writeText/);

  assert.match(page, /maxLength=\{question\.maximumLength\}/);
  assert.match(page, /length >= question\.minimumLength/);
  assert.match(page, /length <= question\.maximumLength/);
  assert.match(page, /answers: \{ \.\.\.state\.answers, \[action\.questionId\]: action\.answer \}/);
  assert.match(page, /aria-live="polite"/);
});
