"""SMTP and Local Development Email Delivery Provider.

Task 16 & 17: Optional SMTP delivery with HTML templates, fallback to local
email logging adapter when SMTP credentials are not configured.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
from typing import List, Optional
from app.core.config import settings
from app.core.logging import logger


class EmailDeliveryService:
    def __init__(self):
        self.smtp_host = getattr(settings, "SMTP_HOST", os.getenv("SMTP_HOST", ""))
        self.smtp_port = int(getattr(settings, "SMTP_PORT", os.getenv("SMTP_PORT", 587)))
        self.smtp_user = getattr(settings, "SMTP_USER", os.getenv("SMTP_USER", ""))
        self.smtp_pass = getattr(settings, "SMTP_PASSWORD", os.getenv("SMTP_PASSWORD", ""))
        self.sender_email = getattr(settings, "SMTP_FROM_EMAIL", os.getenv("SMTP_FROM_EMAIL", "reports@aicallagent.internal"))
        self.use_tls = getattr(settings, "SMTP_TLS", os.getenv("SMTP_TLS", "true")).lower() == "true"

    def is_smtp_configured(self) -> bool:
        """Return True if valid SMTP credentials are configured."""
        return bool(self.smtp_host and self.smtp_user)

    def send_report_email(
        self,
        recipients: List[str],
        subject: str,
        html_body: str,
        attachment_filepath: Optional[str] = None,
    ) -> bool:
        """Deliver report email via SMTP, or log to local development capture if unconfigured."""
        if not recipients:
            return False

        if not self.is_smtp_configured():
            logger.info(
                f"[FREE DEV MODE] Mock Email Delivery captured for recipients: {recipients} | "
                f"Subject: '{subject}' | Attachment: {attachment_filepath}"
            )
            return True

        try:
            msg = MIMEMultipart()
            msg["From"] = self.sender_email
            msg["To"] = ", ".join(recipients)
            msg["Subject"] = subject

            msg.attach(MIMEText(html_body, "html"))

            if attachment_filepath and os.path.exists(attachment_filepath):
                filename = os.path.basename(attachment_filepath)
                with open(attachment_filepath, "rb") as f:
                    part = MIMEApplication(f.read(), Name=filename)
                part["Content-Disposition"] = f'attachment; filename="{filename}"'
                msg.attach(part)

            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            if self.use_tls:
                server.starttls()
            if self.smtp_user and self.smtp_pass:
                server.login(self.smtp_user, self.smtp_pass)

            server.sendmail(self.sender_email, recipients, msg.as_string())
            server.quit()
            logger.info(f"Report email successfully delivered to {recipients}")
            return True

        except Exception as e:
            logger.error(f"Failed to deliver SMTP report email: {e}")
            return False
