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

export const buildSubmissionOutcomeEmail = ({
  outcome,
  hashId,
  version,
  challengeTitle,
  rejectionReason,
}) => {
  const safeTitle = escapeHtml(challengeTitle || 'Challenge')
  const safeHashId = escapeHtml(hashId)

  if (outcome === 'REJECTED') {
    const reason =
      rejectionReason ||
      'Tệp bài làm không vượt qua bước kiểm tra an toàn nên chưa thể được chuyển tới nhà tuyển dụng.'
    const safeReason = escapeHtml(reason)

    return {
      subject: 'POWORK — Bài nộp chưa được chấp nhận',
      text: `Chào bạn,\n\nBài nộp cho thử thách “${challengeTitle}” chưa được chấp nhận.\n\nLý do: ${reason}\n\nĐể bảo vệ bạn và nhà tuyển dụng, POWORK không chuyển tiếp những tệp chưa đáp ứng yêu cầu an toàn. Bạn có thể kiểm tra lại tệp, loại bỏ nội dung có nguy cơ và nộp một phiên bản mới.\n\nMã ẩn danh: ${hashId} — Phiên bản v${version}\n\nĐội ngũ POWORK`,
      html: `
        <p>Chào bạn,</p>
        <p>Bài nộp cho thử thách <strong>${safeTitle}</strong> chưa được chấp nhận.</p>
        <p><strong>Lý do:</strong> ${safeReason}</p>
        <p>Để bảo vệ bạn và nhà tuyển dụng, POWORK không chuyển tiếp những tệp chưa đáp ứng yêu cầu an toàn. Bạn có thể kiểm tra lại tệp, loại bỏ nội dung có nguy cơ và nộp một phiên bản mới.</p>
        <p>Mã ẩn danh: <strong>${safeHashId}</strong> — Phiên bản v${version}</p>
        <p>Đội ngũ POWORK</p>
      `,
    }
  }

  return {
    subject: 'POWORK — Bài làm đã được ghi nhận thành công',
    text: `Chào bạn,\n\nCảm ơn bạn đã hoàn thành và gửi bài cho thử thách “${challengeTitle}”. Bài làm đã được ghi nhận thành công và sẵn sàng cho quá trình đánh giá ẩn danh.\n\nMã ẩn danh: ${hashId} — Phiên bản v${version}\n\nNhà tuyển dụng sẽ đánh giá năng lực thể hiện trong bài làm trước khi có thể tiếp cận danh tính của bạn.\n\nChúc bạn đạt kết quả tốt.\nĐội ngũ POWORK`,
    html: `
      <p>Chào bạn,</p>
      <p>Cảm ơn bạn đã hoàn thành và gửi bài cho thử thách <strong>${safeTitle}</strong>.</p>
      <p>Bài làm đã được ghi nhận thành công và sẵn sàng cho quá trình đánh giá ẩn danh.</p>
      <p>Mã ẩn danh: <strong>${safeHashId}</strong> — Phiên bản v${version}</p>
      <p>Nhà tuyển dụng sẽ đánh giá năng lực thể hiện trong bài làm trước khi có thể tiếp cận danh tính của bạn.</p>
      <p>Chúc bạn đạt kết quả tốt.<br />Đội ngũ POWORK</p>
    `,
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
