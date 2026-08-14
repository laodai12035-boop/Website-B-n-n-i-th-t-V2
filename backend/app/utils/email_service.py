"""
app/utils/email_service.py — Dịch vụ gửi Email qua Gmail SMTP (NT-01-CN-004).

Hỗ trợ:
- Gửi Email HTML chuyên nghiệp qua Gmail SMTP (smtp.gmail.com:587)
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
    def _build_reset_password_html(user_name: str, recipient_email: str, reset_link: str) -> str:
        """Tạo mẫu giao diện HTML Email lấy lại mật khẩu chuẩn thương hiệu Nội Thất V2."""
        return f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Đặt lại mật khẩu — Website Nội Thất V2</title>
          <style>
            body {{
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #f4f6f8;
              margin: 0;
              padding: 20px;
              color: #333333;
            }}
            .container {{
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              border: 1px solid #e5e7eb;
            }}
            .header {{
              background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
              padding: 32px 24px;
              text-align: center;
              color: #ffffff;
            }}
            .header h1 {{
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              letter-spacing: -0.5px;
            }}
            .header p {{
              margin: 6px 0 0 0;
              font-size: 13px;
              opacity: 0.9;
            }}
            .content {{
              padding: 36px 32px;
            }}
            .greeting {{
              font-size: 18px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 16px;
            }}
            .text {{
              font-size: 15px;
              line-height: 1.6;
              color: #4b5563;
              margin-bottom: 24px;
            }}
            .btn-container {{
              text-align: center;
              margin: 32px 0;
            }}
            .btn {{
              display: inline-block;
              background-color: #d97706;
              color: #ffffff !important;
              font-size: 15px;
              font-weight: 700;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
              transition: all 0.2s ease;
            }}
            .link-box {{
              background-color: #f9fafb;
              border: 1px dashed #d1d5db;
              border-radius: 8px;
              padding: 12px;
              font-size: 12px;
              color: #6b7280;
              word-break: break-all;
              margin-top: 20px;
            }}
            .footer {{
              background-color: #f9fafb;
              padding: 20px 32px;
              text-align: center;
              border-top: 1px solid #f3f4f6;
              font-size: 12px;
              color: #9ca3af;
            }}
            .footer strong {{
              color: #6b7280;
            }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🪑 WEBSITE NỘI THẤT V2</h1>
              <p>Hệ thống Quản lý & Mua sắm Nội Thất Cao Cấp</p>
            </div>
            
            <div class="content">
              <div class="greeting">Xin chào {user_name or 'Quý khách'},</div>
              <div class="text">
                Chúng tôi nhận được yêu cầu thiết lập lại mật khẩu cho tài khoản <strong>{recipient_email}</strong>. 
                Nếu đúng là bạn đã yêu cầu, vui lòng bấm vào nút bên dưới để tiến hành lấy lại mật khẩu:
              </div>
              
              <div class="btn-container">
                <a href="{reset_link}" target="_blank" class="btn">🔒 ĐẶT LẠI MẬT KHẨU NGAY</a>
              </div>
              
              <div class="text" style="font-size: 13px; color: #6b7280;">
                ⚠️ <em>Liên kết này có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này để bảo vệ an toàn cho tài khoản.</em>
              </div>
              
              <div class="link-box">
                Nếu nút bấm trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br>
                <a href="{reset_link}" style="color: #d97706;">{reset_link}</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Email này được gửi tự động từ <strong>Website Nội Thất V2</strong>.</p>
              <p>© 2026 Nội Thất V2. All rights reserved.</p>
            </div>
          </div>
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

        html_content = cls._build_reset_password_html(user_name, recipient_email, reset_link)

        # Trường hợp 1: Nếu cấu hình MAIL_MOCK = True hoặc chưa điền Mật khẩu ứng dụng Gmail ➔ Log mock
        if mail_mock or not mail_username or not mail_password:
            logger.info(
                "[GMAIL MOCK EMAIL] Yêu cầu đặt lại mật khẩu cho %s | Link: %s (Hạn 15 phút)",
                recipient_email,
                reset_link,
            )
            return True

        # Trường hợp 2: Đã cấu hình Gmail SMTP ➔ Tiến hành gửi thư thật qua Gmail
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "🔒 [Website Nội Thất V2] Hướng dẫn Đặt lại Mật Khẩu"
            msg["From"] = mail_sender
            msg["To"] = recipient_email

            part_html = MIMEText(html_content, "html", "utf-8")
            msg.attach(part_html)

            logger.info("Đang kết nối SMTP Gmail %s:%s để gửi email tới %s...", mail_server, mail_port, recipient_email)

            with smtplib.SMTP(mail_server, mail_port, timeout=10) as server:
                if mail_use_tls:
                    server.starttls()
                server.login(mail_username, mail_password)
                server.sendmail(mail_sender, [recipient_email], msg.as_string())

            logger.info("✅ Gửi email đặt lại mật khẩu thành công tới Gmail: %s", recipient_email)
            return True

        except Exception as exc:
            logger.error("❌ Lỗi gửi Gmail SMTP tới %s: %s", recipient_email, exc)
            # Log fallback link để dev kiểm tra
            logger.info("[FALLBACK RESET LINK] %s", reset_link)
            return False
