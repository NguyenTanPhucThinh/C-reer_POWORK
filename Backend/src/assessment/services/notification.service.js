import transporter from '../../shared/config/mailer.js'
import { config } from '../../shared/config/index.js'
import prisma from '../../shared/config/prisma.js'
import * as userLookupService from '../../iam/services/user-lookup.service.js'

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const renderSubmissionEmail = ({
  eyebrow,
  title,
  introduction,
  challengeTitle,
  hashId,
  version,
  notice,
  reason,
}) => `<!doctype html>
<html lang="vi">
  <body style="margin:0;background:#eef3f5;font-family:Arial,Helvetica,sans-serif;color:#14202a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f5;padding:32px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;overflow:hidden;border:1px solid #d8e1e5;border-radius:16px;background:#ffffff">
            <tr>
              <td style="background:#071823;padding:26px 32px">
                <div style="font-size:26px;font-weight:800;letter-spacing:6px;line-height:1;color:#ffffff">POWORK</div>
                <div style="margin-top:8px;font-size:10px;letter-spacing:1.2px;color:#b7c6ce">Blind Audition Platform</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 30px">
                <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#087c8d">${eyebrow}</div>
                <h1 style="margin:12px 0 26px;font-size:25px;line-height:1.3;color:#14202a">${title}</h1>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#34434d">Chào bạn,</p>
                <p style="margin:0 0 26px;font-size:14px;line-height:1.7;color:#34434d">${introduction}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d8e1e5;border-radius:12px;background:#f5f8f9;padding:18px">
                  <tr>
                    <td style="padding:4px 0;font-size:12px;color:#6c7b84">Thử thách</td>
                    <td align="right" style="padding:4px 0;font-size:13px;font-weight:700;text-transform:uppercase;color:#14202a">${challengeTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:12px;color:#6c7b84">Mã ẩn danh</td>
                    <td align="right" style="padding:4px 0;font-family:Consolas,Monaco,monospace;font-size:12px;color:#087c8d">${hashId}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:12px;color:#6c7b84">Phiên bản</td>
                    <td align="right" style="padding:4px 0;font-size:13px;font-weight:700;color:#14202a">v${version}</td>
                  </tr>
                </table>
                ${reason ? `<div style="margin-top:22px;border-left:3px solid #c47b0b;background:#fff8e8;padding:14px 16px;font-size:13px;line-height:1.7;color:#34434d"><strong style="display:block;margin-bottom:4px;color:#14202a">Lý do</strong>${reason}</div>` : ''}
                <p style="margin:26px 0 0;font-size:13px;line-height:1.8;color:#34434d">${notice}</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #d8e1e5;padding:20px 32px;font-size:11px;line-height:1.6;color:#72818a">
                Email này được gửi tự động từ POWORK. Thông tin ứng viên được bảo vệ trong quy trình đánh giá ẩn danh.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

export const buildSubmissionOutcomeEmail = ({
  outcome,
  hashId,
  version,
  challengeTitle,
  rejectionReason,
}) => {
  const title = challengeTitle || 'Challenge'
  const candidateCode = hashId || 'Chưa có'
  const safeTitle = escapeHtml(title)
  const safeHashId = escapeHtml(candidateCode)
  const safeVersion = escapeHtml(version ?? '—')

  if (outcome === 'REJECTED') {
    const reason =
      rejectionReason ||
      'Tệp bài làm không vượt qua bước kiểm tra an toàn nên chưa thể được chuyển tới nhà tuyển dụng.'
    const safeReason = escapeHtml(reason)

    return {
      subject: 'POWORK — Bài nộp chưa được chấp nhận',
      text: `Chào bạn,\n\nBài nộp cho thử thách “${title}” chưa được chấp nhận.\n\nLý do: ${reason}\n\nĐể bảo vệ bạn và nhà tuyển dụng, POWORK không chuyển tiếp những tệp chưa đáp ứng yêu cầu an toàn. Bạn có thể kiểm tra lại tệp, loại bỏ nội dung có nguy cơ và nộp một phiên bản mới.\n\nMã ẩn danh: ${candidateCode} — Phiên bản v${version}\n\nĐội ngũ POWORK`,
      html: renderSubmissionEmail({
        eyebrow: 'Cập nhật bài nộp',
        title: 'Bài nộp chưa được chấp nhận',
        introduction:
          'Tệp bài làm chưa vượt qua bước kiểm tra an toàn và chưa được chuyển tới nhà tuyển dụng.',
        challengeTitle: safeTitle,
        hashId: safeHashId,
        version: safeVersion,
        reason: safeReason,
        notice:
          'Bạn có thể kiểm tra lại tệp, loại bỏ nội dung có nguy cơ và nộp một phiên bản mới.',
      }),
    }
  }

  return {
    subject: 'POWORK — Bài làm đã được ghi nhận thành công',
    text: `Chào bạn,\n\nCảm ơn bạn đã hoàn thành và gửi bài cho thử thách “${title}”. Bài làm đã được ghi nhận thành công và sẵn sàng cho quá trình đánh giá ẩn danh.\n\nMã ẩn danh: ${candidateCode} — Phiên bản v${version}\n\nNhà tuyển dụng sẽ đánh giá năng lực thể hiện trong bài làm trước khi có thể tiếp cận danh tính của bạn.\n\nChúc bạn đạt kết quả tốt.\nĐội ngũ POWORK`,
    html: renderSubmissionEmail({
      eyebrow: 'Xác nhận bài nộp',
      title: 'Bài làm đã được ghi nhận thành công',
      introduction:
        'Cảm ơn bạn đã hoàn thành bài thử thách. Bài làm đã sẵn sàng cho quá trình đánh giá ẩn danh.',
      challengeTitle: safeTitle,
      hashId: safeHashId,
      version: safeVersion,
      notice:
        'Nhà tuyển dụng sẽ đánh giá năng lực thể hiện trong bài làm trước khi có thể tiếp cận danh tính của bạn.',
    }),
  }
}

const deliver = async ({ toEmail, ...details }, mailer = transporter) => {
  const message = buildSubmissionOutcomeEmail(details)
  await mailer.sendMail({ from: config.mail.from, to: toEmail, ...message })
}

export const sendSubmissionAcceptedEmail = async (details, mailer = transporter) => {
  try {
    await deliver({ ...details, outcome: 'ACCEPTED' }, mailer)
  } catch (error) {
    console.error('[Notification] Không gửi được email xác nhận bài nộp:', error.message)
  }
}

export const sendSubmissionScanOutcomeEmail = async (
  submissionId,
  outcome,
  rejectionReason,
  { database = prisma, getUserById = userLookupService.getUserById, mailer = transporter } = {},
) => {
  try {
    const submission = await database.submission.findUnique({
      where: { id: submissionId },
      select: {
        hashId: true,
        version: true,
        identityMapping: { select: { userId: true } },
        challenge: { select: { title: true } },
      },
    })
    if (!submission?.identityMapping?.userId) return

    const { email } = await getUserById(submission.identityMapping.userId)
    await deliver(
      {
        toEmail: email,
        outcome,
        hashId: submission.hashId,
        version: submission.version,
        challengeTitle: submission.challenge.title,
        rejectionReason,
      },
      mailer,
    )
  } catch (error) {
    console.error('[Notification] Không gửi được email kết quả quét bài nộp:', error.message)
  }
}
