"""
app/utils/email_service.py — Dịch vụ gửi Email qua Gmail SMTP (NT-01-CN-004).

Hỗ trợ:
- Gửi Email HTML chuyên nghiệp tương thích 100% với Gmail Web & Mobile App (Inline CSS + Table Layout + MIME Multipart Plain Text)
- Chế độ Mock Fallback khi chưa cấu hình Mật khẩu ứng dụng Gmail hoặc trong Test Environment.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

logger = logging.getLogger(__name__)


class EmailService:
    """Utility service quản lý việc gửi email thông báo từ hệ thống."""

    @staticmethod
    def _build_reset_password_plain_text(user_name: str, recipient_email: str, reset_link: str) -> str:
        """Tạo bản tin Plain Text dành cho các Email Client không hỗ trợ HTML hoặc để qua mặt Spam Filter."""
        return f"""Xin chào {user_name or 'Quý khách'},

Chúng tôi đã nhận được yêu cầu thiết lập lại mật khẩu cho tài khoản {recipient_email} tại Website Nội Thất V2.

Vui lòng sao chép hoặc mở liên kết dưới đây trên trình duyệt để tiến hành đặt lại mật khẩu (Liên kết có hiệu lực trong 15 phút):
{reset_link}

Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này để đảm bảo an toàn cho tài khoản.

Trân trọng,
Đội ngũ Website Nội Thất V2
"""

    @staticmethod
    def _build_reset_password_html(user_name: str, recipient_email: str, reset_link: str) -> str:
        """
        Tạo mẫu giao diện HTML Email chuẩn Gmail (100% Inline CSS + Table Bulletproof Button).
        Đảm bảo nút bấm hiển thị và nhấp được trên mọi Email Client (Gmail Web, iOS Mail, Outlook, Android).
        """
        return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="vi">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đặt lại mật khẩu — Website Nội Thất V2</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f4f6f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <!-- Outer Table Container -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        
        <!-- Main Card (Max 600px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: #d97706; background-color: #d97706; padding: 32px 24px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">
                🪑 WEBSITE NỘI THẤT V2
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fef3c7; opacity: 0.95;">
                Hệ thống Quản lý & Mua sắm Nội Thất Cao Cấp
              </p>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #111827;">
                Xin chào {user_name or 'Quý khách'},
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                Chúng tôi nhận được yêu cầu thiết lập lại mật khẩu cho tài khoản <strong style="color: #111827;">{recipient_email}</strong>.
                Nếu đúng là bạn đã thực hiện yêu cầu này, vui lòng bấm vào nút bên dưới để tiến hành lấy lại mật khẩu:
              </p>
              
              <!-- BULLETPROOF BUTTON FOR GMAIL & OUTLOOK -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#d97706" style="border-radius: 12px; background-color: #d97706;">
                          <a href="{reset_link}" target="_blank" style="font-size: 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-weight: bold; color: #ffffff !important; text-decoration: none; border-radius: 12px; padding: 14px 32px; border: 1px solid #d97706; display: inline-block; background-color: #d97706; text-align: center; cursor: pointer;">
                            🔒 ĐẶT LẠI MẬT KHẨU NGAY
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #d97706; background-color: #fffbe6; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #d97706;">
                ⚠️ <strong>Lưu ý quan trọng:</strong> Liên kết này có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này để đảm bảo an toàn cho tài khoản.
              </p>
              
              <!-- Fallback Direct Link Box -->
              <div style="background-color: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 14px; margin-top: 24px; font-size: 12px; color: #6b7280; word-break: break-all;">
                Nếu không thể nhấp vào nút bấm trên, hãy dán trực tiếp đường dẫn sau vào trình duyệt:<br />
                <a href="{reset_link}" target="_blank" style="color: #d97706; font-weight: bold; text-decoration: underline; word-break: break-all;">{reset_link}</a>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 4px 0;">Email này được gửi tự động từ <strong>Website Nội Thất V2</strong>.</p>
              <p style="margin: 0;">© 2026 Nội Thất V2. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
"""

    @classmethod
    def send_reset_password_email(
        cls,
        recipient_email: str,
        reset_link: str,
        user_name: str = "Khách hàng",
    ) -> bool:
        """
        Gửi email chứa link reset password đến Gmail của người dùng.

        Args:
            recipient_email: Email nhận thư (Gmail của khách)
            reset_link:      Đường dẫn form reset password kèm token
            user_name:       Tên người nhận (tùy chọn)

        Returns:
            bool: True nếu gửi thư thành công (hoặc mock logged), False nếu xảy ra lỗi.
        """
        config = current_app.config
        mail_server = config.get("MAIL_SERVER", "smtp.gmail.com")
        mail_port = config.get("MAIL_PORT", 587)
        mail_use_tls = config.get("MAIL_USE_TLS", True)
        mail_username = config.get("MAIL_USERNAME", "")
        mail_password = config.get("MAIL_PASSWORD", "")
        mail_sender = config.get("MAIL_DEFAULT_SENDER", mail_username or "noithatv2@gmail.com")
        mail_mock = config.get("MAIL_MOCK", True)

        plain_text_content = cls._build_reset_password_plain_text(user_name, recipient_email, reset_link)
        html_content = cls._build_reset_password_html(user_name, recipient_email, reset_link)

        # Trường hợp 1: Nếu cấu hình MAIL_MOCK = True hoặc chưa điền Mật khẩu ứng dụng Gmail ➔ Log mock
        if mail_mock or not mail_username or not mail_password:
            logger.info(
                "[GMAIL MOCK EMAIL] Yêu cầu đặt lại mật khẩu cho %s | Link: %s (Hạn 15 phút)",
                recipient_email,
                reset_link,
            )
            return True

        # Trường hợp 2: Đã cấu hình Gmail SMTP ➔ Gửi cả Plain Text và HTML qua Gmail
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "🔒 [Website Nội Thất V2] Hướng dẫn Đặt lại Mật Khẩu"
            msg["From"] = mail_sender
            msg["To"] = recipient_email

            # Đính kèm cả plain text lẫn html để tránh bị Gmail đưa vào Spam và giúp link luôn click được
            part_text = MIMEText(plain_text_content, "plain", "utf-8")
            part_html = MIMEText(html_content, "html", "utf-8")

            msg.attach(part_text)
            msg.attach(part_html)

            logger.info("Đang kết nối SMTP Gmail %s:%s để gửi email tới %s...", mail_server, mail_port, recipient_email)

            with smtplib.SMTP(mail_server, mail_port, timeout=15) as server:
                if mail_use_tls:
                    server.starttls()
                server.login(mail_username, mail_password)
                server.sendmail(mail_sender, [recipient_email], msg.as_string())

            logger.info("✅ Gửi email đặt lại mật khẩu thành công tới Gmail: %s", recipient_email)
            return True

        except Exception as exc:
            logger.error("❌ Lỗi gửi Gmail SMTP tới %s: %s", recipient_email, exc)
            logger.info("[FALLBACK RESET LINK] %s", reset_link)
            return False
