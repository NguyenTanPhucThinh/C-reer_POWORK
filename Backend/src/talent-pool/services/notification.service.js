import transporter from '../../shared/config/mailer.js'
import { config } from '../../shared/config/index.js'

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export const buildInterviewInvitationEmail = ({ candidateName, companyName }) => {
  const safeCandidateName = escapeHtml(candidateName || 'Ứng viên')
  const safeCompanyName = escapeHtml(companyName || 'Nhà tuyển dụng')
  const profileUrl = `${config.clientUrl.replace(/\/$/, '')}/candidate/profile`

  return {
    subject: 'POWORK — Lời mời tham gia phỏng vấn',
    text: `Chào ${candidateName || 'bạn'},\n\nChúc mừng bạn! ${companyName || 'Nhà tuyển dụng'} đã xem xét kết quả thử thách và quyết định mời bạn tham gia vòng phỏng vấn.\n\nNhà tuyển dụng có thể liên hệ với bạn qua thông tin đã đăng ký trên POWORK. Vui lòng kiểm tra email thường xuyên và bảo đảm thông tin trong Dynamic Profile luôn chính xác.\n\nĐội ngũ POWORK`,
    html: `<!doctype html>
<html lang="vi">
  <body style="margin:0;background:#eef3f5;font-family:Arial,Helvetica,sans-serif;color:#14202a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f5;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;overflow:hidden;border:1px solid #d8e1e5;border-radius:16px;background:#ffffff">
          <tr><td style="background:#071823;padding:26px 32px">
            <div style="font-size:26px;font-weight:800;letter-spacing:6px;line-height:1;color:#ffffff">POWORK</div>
            <div style="margin-top:8px;font-size:10px;letter-spacing:1.2px;color:#b7c6ce">Blind Audition Platform</div>
          </td></tr>
          <tr><td style="padding:36px 32px 30px">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#087c8d">Lời mời phỏng vấn</div>
            <h1 style="margin:12px 0 26px;font-size:25px;line-height:1.3;color:#14202a">Chúc mừng bạn đã được mời phỏng vấn</h1>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#34434d">Chào ${safeCandidateName},</p>
            <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#34434d"><strong>${safeCompanyName}</strong> đã xem xét kết quả thử thách và quyết định mời bạn tham gia vòng phỏng vấn.</p>
            <div style="border-left:3px solid #087c8d;background:#f2f8f9;padding:14px 16px;font-size:13px;line-height:1.7;color:#34434d">Nhà tuyển dụng có thể liên hệ qua email bạn đã đăng ký. Hãy kiểm tra hộp thư thường xuyên và bảo đảm thông tin hồ sơ luôn chính xác.</div>
            <p style="margin:26px 0 0"><a href="${escapeHtml(profileUrl)}" style="display:inline-block;border-radius:9px;background:#087c8d;padding:12px 18px;font-size:13px;font-weight:700;text-decoration:none;color:#ffffff">Xem Dynamic Profile</a></p>
          </td></tr>
          <tr><td style="border-top:1px solid #d8e1e5;padding:20px 32px;font-size:11px;line-height:1.6;color:#72818a">Email này được gửi tự động từ POWORK sau khi nhà tuyển dụng cập nhật quyết định tuyển dụng.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  }
}

export const sendInterviewInvitationEmail = async (details, mailer = transporter) => {
  try {
    const message = buildInterviewInvitationEmail(details)
    await mailer.sendMail({ from: config.mail.from, to: details.toEmail, ...message })
  } catch (error) {
    console.error('[Notification] Không gửi được email mời phỏng vấn:', error.message)
  }
}
