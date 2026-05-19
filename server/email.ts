import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 465);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "premium910.web-hosting.com",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.REPLIT_DOMAINS)
    return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`;
  return "https://internship.etherauthority.io/";
}

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP configuration error:", error);
  } else {
    console.log("✅ SMTP server is ready");
  }
});

function baseLayout(
  headerIcon: string,
  headerTitle: string,
  headerSubtitle: string,
  bodyContent: string,
  accentColor: string = "#a855f7",
): string {
  const accentLight =
    accentColor === "#a855f7"
      ? "#c084fc"
      : accentColor === "#10b981"
        ? "#34d399"
        : "#60a5fa";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0f0b1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0b1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.5),0 0 40px rgba(168,85,247,0.08);">

          <!-- Logo Bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1030 0%,#0f172a 100%);padding:24px 40px;border-bottom:1px solid rgba(168,85,247,0.15);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">
                      <span style="color:${accentLight};">Ether</span>Authority
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Internship Program</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="background:linear-gradient(160deg,#1e1145 0%,#0c1929 50%,#0a1628 100%);padding:50px 40px 40px;text-align:center;position:relative;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${accentColor} 0%,${accentLight} 100%);display:inline-block;line-height:72px;text-align:center;font-size:32px;box-shadow:0 8px 24px ${accentColor}40;">
                      ${headerIcon}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">${headerTitle}</h1>
                    ${headerSubtitle ? `<p style="margin:10px 0 0;font-size:15px;color:#94a3b8;line-height:1.5;">${headerSubtitle}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="background:linear-gradient(180deg,#111827 0%,#0f172a 100%);padding:40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0e1a;padding:30px 40px;border-top:1px solid rgba(168,85,247,0.1);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 8px;">
                          <a href="https://etherauthority.io" style="color:#8b5cf6;text-decoration:none;font-size:13px;font-weight:500;">Website</a>
                        </td>
                        <td style="color:#334155;padding:0 4px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="https://twitter.com/EtherAuthority" style="color:#8b5cf6;text-decoration:none;font-size:13px;font-weight:500;">Twitter</a>
                        </td>
                        <td style="color:#334155;padding:0 4px;">|</td>
                        <td style="padding:0 8px;">
                          <a href="https://discord.gg/RQWRmpQeUW" style="color:#8b5cf6;text-decoration:none;font-size:13px;font-weight:500;">Discord</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                      EtherAuthority &mdash; Leading Blockchain Security &amp; Smart Contract Solutions
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#334155;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function makeButton(
  text: string,
  url: string,
  color: string = "#a855f7",
): string {
  const colorEnd =
    color === "#a855f7"
      ? "#7c3aed"
      : color === "#10b981"
        ? "#059669"
        : color === "#5865F2"
          ? "#4752C4"
          : "#2563eb";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td align="center" style="border-radius:10px;background:linear-gradient(135deg,${color} 0%,${colorEnd} 100%);box-shadow:0 4px 16px ${color}30;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

function makeCredentialBox(
  rows: Array<{ label: string; value: string }>,
): string {
  let rowsHtml = rows
    .map(
      (r, i) => `
    <tr>
      <td style="padding:14px 20px;${i < rows.length - 1 ? "border-bottom:1px solid rgba(139,92,246,0.12);" : ""}">
        <span style="display:block;font-size:11px;color:#8b5cf6;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:6px;">${r.label}</span>
        <span style="display:block;font-size:17px;font-weight:700;color:#e2e8f0;font-family:'Courier New',monospace;letter-spacing:0.5px;word-break:break-all;">${r.value}</span>
      </td>
    </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;background:linear-gradient(135deg,#1e1b4b 0%,#172035 100%);border:1px solid rgba(139,92,246,0.2);margin:24px 0;">
    ${rowsHtml}
  </table>`;
}

function makeAlert(text: string, type: "warning" | "info" | "success"): string {
  const colors = {
    warning: {
      bg: "#1c1305",
      border: "#f59e0b",
      text: "#fbbf24",
      icon: "&#9888;&#65039;",
    },
    info: {
      bg: "#0c1929",
      border: "#3b82f6",
      text: "#60a5fa",
      icon: "&#8505;&#65039;",
    },
    success: {
      bg: "#052e16",
      border: "#10b981",
      text: "#34d399",
      icon: "&#10003;",
    },
  };
  const c = colors[type];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:${c.bg};border-left:4px solid ${c.border};border-radius:0 8px 8px 0;padding:16px 20px;">
        <p style="margin:0;font-size:14px;color:${c.text};line-height:1.5;">
          ${c.icon} ${text}
        </p>
      </td>
    </tr>
  </table>`;
}

export async function sendApprovalEmail(
  to: string,
  name: string,
  password: string,
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("Email not configured, skipping approval email to:", to);
    return;
  }

  const bodyContent = `
    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">
      Hello <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 8px;">
      We are thrilled to inform you that your internship application has been <strong style="color:#10b981;">approved</strong>! Welcome to the EtherAuthority team.
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      You can now access your intern dashboard using the credentials below:
    </p>

    ${makeCredentialBox([
      { label: "Email Address", value: to },
      { label: "Password", value: password },
    ])}

    ${makeAlert("<strong>Important:</strong> Please change your password after your first login for security.", "warning")}

    <div style="text-align:center;padding:8px 0 16px;">
      ${makeButton("Login to Dashboard &rarr;", `${getAppUrl()}/intern/login`, "#10b981")}
    </div>

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:24px 0 0;">
      We're excited to have you on board and look forward to working with you!
    </p>
    <p style="color:#64748b;font-size:14px;margin:20px 0 0;">
      Best regards,<br>
      <strong style="color:#94a3b8;">The EtherAuthority Team</strong>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority Internships" <${process.env.SMTP_USER}>`,
      to,
      subject: "Your Internship Application Has Been Approved!",
      html: baseLayout(
        "&#9989;",
        "Application Approved!",
        "Welcome to the EtherAuthority Internship Program",
        bodyContent,
        "#10b981",
      ),
    });
    console.log("Approval email sent to:", to);
  } catch (error) {
    console.error("Failed to send approval email:", error);
  }
}

export async function sendInternshipApprovalEmail(
  to: string,
  name: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!process.env.SMTP_USER) {
    console.log(
      "Email not configured, skipping internship approval email to:",
      to,
    );
    return { sent: false, error: "SMTP not configured" };
  }

  const bodyContent = `
    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">
      Hello <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Great news — the admin has reviewed your training submission and
      <strong style="color:#10b981;">approved you for the internship phase</strong>.
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Your internship offer letter has been generated. You can now log in,
      accept the Terms &amp; Conditions, download your offer letter and start
      working on your internship projects.
    </p>
    <div style="text-align:center;padding:8px 0 16px;">
      ${makeButton("Open Intern Dashboard &rarr;", `${getAppUrl()}/intern/login`, "#10b981")}
    </div>
    <p style="color:#64748b;font-size:14px;margin:20px 0 0;">
      Best regards,<br>
      <strong style="color:#94a3b8;">The EtherAuthority Team</strong>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority Internships" <${process.env.SMTP_USER}>`,
      to,
      subject: "You're approved for the EtherAuthority Internship",
      html: baseLayout(
        "&#127881;",
        "Approved for Internship",
        "Your training has been reviewed and approved",
        bodyContent,
        "#10b981",
      ),
    });
    console.log("Internship approval email sent to:", to);
    return { sent: true };
  } catch (error: any) {
    console.error("Failed to send internship approval email:", error);
    return { sent: false, error: error?.message || "send failed" };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  tempPassword: string,
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("Email not configured, skipping password reset email to:", to);
    return;
  }

  const bodyContent = `
    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">
      Hello <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      We received a request to reset your password for your EtherAuthority Internship Portal account. Your new temporary password is below:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background:linear-gradient(135deg,#1e1b4b 0%,#172035 100%);border:1px solid rgba(139,92,246,0.25);border-radius:12px;padding:28px 20px;">
          <span style="display:block;font-size:11px;color:#8b5cf6;text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:12px;">Temporary Password</span>
          <span style="display:block;font-size:32px;font-weight:800;color:#ffffff;font-family:'Courier New',monospace;letter-spacing:3px;">${tempPassword}</span>
        </td>
      </tr>
    </table>

    ${makeAlert("<strong>Important:</strong> Log in with this temporary password and change it immediately from your profile settings.", "warning")}

    <div style="text-align:center;padding:8px 0 16px;">
      ${makeButton("Login to Portal &rarr;", "https://internship.etherauthority.io/intern/login")}
    </div>

    ${makeAlert("If you did not request this password reset, please contact our support team immediately.", "info")}

    <p style="color:#64748b;font-size:14px;margin:24px 0 0;">
      Best regards,<br>
      <strong style="color:#94a3b8;">The EtherAuthority Team</strong>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority Internships" <${process.env.SMTP_USER}>`,
      to,
      subject: "Password Reset - EtherAuthority Internship Portal",
      html: baseLayout(
        "&#128274;",
        "Password Reset",
        "Your password has been reset successfully",
        bodyContent,
      ),
    });
    console.log("Password reset email sent to:", to);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}

export async function sendThankYouEmail(
  to: string,
  name: string,
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("Email not configured, skipping thank you email to:", to);
    return;
  }

  const bodyContent = `
    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">
      Hello <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 8px;">
      Thank you for applying to the EtherAuthority Internship Program. Your application has been successfully received and is under review.
    </p>

    ${makeAlert("&#10003; Your application has been <strong>successfully submitted</strong>!", "success")}

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:20px 0 8px;">
      In the meantime, log in to the Intern Panel to start your training and track your progress:
    </p>

    ${makeCredentialBox([
      { label: "Login Email", value: to },
      { label: "Default Password", value: "123456" },
    ])}

    ${makeAlert("<strong>Important:</strong> Please change your default password after your first login for security.", "warning")}

    <div style="text-align:center;padding:8px 0;">
      ${makeButton("Login to Intern Panel &rarr;", "https://internship.etherauthority.io/intern/login")}
    </div>

    <div style="text-align:center;padding:8px 0 16px;">
      ${makeButton("Join Our Discord Community", "https://discord.gg/RQWRmpQeUW", "#5865F2")}
    </div>

    ${makeAlert("If you face any issues logging in, please reach out via our Discord community or contact the support team.", "info")}

    <!-- What's Next Section -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#1e1b4b 0%,#172035 100%);border:1px solid rgba(139,92,246,0.15);padding:24px;">
          <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:1px;">What Happens Next?</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;">
                <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#a855f7;color:#fff;text-align:center;line-height:22px;font-size:12px;font-weight:700;">1</span>
              </td>
              <td style="padding:8px 0 8px 12px;color:#94a3b8;font-size:14px;line-height:1.5;">Log in and complete the 4-week training course modules</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;">
                <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#a855f7;color:#fff;text-align:center;line-height:22px;font-size:12px;font-weight:700;">2</span>
              </td>
              <td style="padding:8px 0 8px 12px;color:#94a3b8;font-size:14px;line-height:1.5;">Complete the test project and pass the exam</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;">
                <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#a855f7;color:#fff;text-align:center;line-height:22px;font-size:12px;font-weight:700;">3</span>
              </td>
              <td style="padding:8px 0 8px 12px;color:#94a3b8;font-size:14px;line-height:1.5;">Generate your certificates and join the internship</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:14px;margin:24px 0 0;">
      Best regards,<br>
      <strong style="color:#94a3b8;">The EtherAuthority Team</strong>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority Internships"  <${process.env.SMTP_USER}>`,
      to,
      subject: "Application Submitted Successfully - EtherAuthority Internship",
      html: baseLayout(
        "&#128640;",
        "Application Received!",
        "Thank you for applying to our internship program",
        bodyContent,
      ),
    });
    console.log("Thank you email sent to:", to);
  } catch (error) {
    console.error("Failed to send thank you email:", error);
  }
}

export async function sendTrainingOfferLetterEmail(
  to: string,
  name: string,
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log(
      "Email not configured, skipping training offer letter to:",
      to,
    );
    return;
  }

  const issueDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const startDate = new Date(
    Date.now() + 1 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bodyContent = `
    <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 4px;">
      Date of Issue: <strong style="color:#e2e8f0;">${issueDate}</strong>
    </p>
    <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 24px;">
      Reference: <strong style="color:#e2e8f0;">EA/TRN/${new Date().getFullYear()}</strong>
    </p>

    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 16px;">
      Dear <strong style="color:#ffffff;">${name}</strong>,
    </p>

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Congratulations and welcome to <strong style="color:#a855f7;">EtherAuthority</strong>!
      We are delighted to formally extend this offer to enroll you in our
      <strong style="color:#ffffff;">Internship Training Program</strong>, an intensive
      4-week program designed to prepare you for a real-world internship in Web3,
      Blockchain, AI, and modern web technologies.
    </p>

    ${makeAlert("&#10003; Your training seat has been <strong>confirmed</strong>. You may begin immediately by logging in.", "success")}

    <!-- Training details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 16px;">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#1e1b4b 0%,#172035 100%);border:1px solid rgba(139,92,246,0.20);padding:20px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:1px;">Training Details</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#94a3b8;font-size:14px;width:170px;">Program</td>
              <td style="padding:6px 0;color:#e2e8f0;font-size:14px;font-weight:600;">EtherAuthority Internship Training Program</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#94a3b8;font-size:14px;">Duration</td>
              <td style="padding:6px 0;color:#e2e8f0;font-size:14px;font-weight:600;">4 Weeks (Self-paced)</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#94a3b8;font-size:14px;">Mode</td>
              <td style="padding:6px 0;color:#e2e8f0;font-size:14px;font-weight:600;">Remote / Online</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#94a3b8;font-size:14px;">Tentative Start</td>
              <td style="padding:6px 0;color:#e2e8f0;font-size:14px;font-weight:600;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#94a3b8;font-size:14px;">Stipend</td>
              <td style="padding:6px 0;color:#e2e8f0;font-size:14px;font-weight:600;">Unpaid (during training phase)</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Terms -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="border-radius:12px;background:rgba(15,23,42,0.4);border:1px solid rgba(148,163,184,0.15);padding:20px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;">Key Terms</p>
          <ol style="margin:0;padding-left:20px;color:#94a3b8;font-size:14px;line-height:1.8;">
            <li>Complete all 4-week training modules within the program duration.</li>
            <li>Submit the Week-4 task / direct exam to qualify for the paid internship phase.</li>
            <li>Maintain professional conduct and uphold confidentiality of project material.</li>
            <li>On successful training completion you will receive a Training Certificate, and may be considered for the paid internship phase subject to admin approval.</li>
          </ol>
        </td>
      </tr>
    </table>

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 16px;">
      To begin your training, please log in to your Intern Portal — your credentials have already
      been sent to you in a separate email titled <em>"Application Submitted Successfully"</em>.
    </p>

    <div style="text-align:center;padding:8px 0 16px;">
      ${makeButton("Start My Training &rarr;", `${getAppUrl()}/intern/login`, "#a855f7")}
    </div>

    ${makeAlert("This is a system-generated training offer letter. A signed copy will be made available in your Intern Portal under the <strong>Certificates</strong> section after Week-4 completion.", "info")}

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:24px 0 8px;">
      We look forward to your active participation. Best of luck with your training journey!
    </p>

    <p style="color:#64748b;font-size:14px;margin:20px 0 0;">
      Warm regards,<br>
      <strong style="color:#94a3b8;">Yogesh Padsala</strong><br>
      <span style="color:#64748b;font-size:13px;">Founder &amp; CTO, EtherAuthority</span>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority Internships" <${process.env.SMTP_USER}>`,
      to,
      subject: "Training Offer Letter - EtherAuthority Internship Program",
      html: baseLayout(
        "&#128218;",
        "Training Offer Letter",
        "Welcome to the EtherAuthority Internship Training Program",
        bodyContent,
      ),
    });
    console.log("Training offer letter sent to:", to);
  } catch (error) {
    console.error("Failed to send training offer letter:", error);
  }
}

export async function sendAdminNotification(
  internName: string,
  internEmail: string,
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!process.env.SMTP_USER || !adminEmail) {
    console.log("Email not configured, skipping admin notification");
    return;
  }

  const bodyContent = `
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      A new internship application has been submitted and requires your review.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;background:linear-gradient(135deg,#1e1b4b 0%,#172035 100%);border:1px solid rgba(139,92,246,0.2);margin:0 0 24px;">
      <tr>
        <td style="padding:20px;border-bottom:1px solid rgba(139,92,246,0.12);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:110px;vertical-align:top;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Applicant</span>
              </td>
              <td>
                <span style="font-size:16px;font-weight:700;color:#e2e8f0;">${internName}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;border-bottom:1px solid rgba(139,92,246,0.12);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:110px;vertical-align:top;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Email</span>
              </td>
              <td>
                <a href="mailto:${internEmail}" style="font-size:15px;color:#8b5cf6;text-decoration:none;">${internEmail}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:110px;vertical-align:top;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Submitted</span>
              </td>
              <td>
                <span style="font-size:15px;color:#94a3b8;">${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align:center;padding:8px 0 16px;">
      ${makeButton("Review in Admin Panel &rarr;", `${getAppUrl()}/admin`)}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority Internships" <${process.env.SMTP_USER}>`,
      to: "marketing@scaiworld.org",
      subject: `New Internship Application - ${internName}`,
      html: baseLayout(
        "&#128236;",
        "New Application",
        `${internName} has submitted an internship application`,
        bodyContent,
      ),
    });
    console.log("Admin notification sent for:", internName);
  } catch (error) {
    console.error("Failed to send admin notification:", error);
  }
}

export async function sendDaoApplicationThankYouEmail(
  to: string,
  name: string,
  position: string,
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("Email not configured, skipping DAO thank you email to:", to);
    return;
  }

  const bodyContent = `
    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">
      Hello <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 8px;">
      Thank you for applying to join the <strong style="color:#c084fc;">EtherAuthority DAO</strong> as a <strong style="color:#ffffff;">${position}</strong>.
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      We have received your application and our team will review it shortly. You'll hear back from us soon with the next steps.
    </p>

    ${makeAlert("&#10003; Your DAO application has been <strong>successfully submitted</strong>!", "success")}

    ${makeAlert("Once approved by admin you can login DAO Panel, you will receive an email with your login credentials to access the DAO panel.", "info")}

    <p style="color:#64748b;font-size:14px;margin:24px 0 0;">
      Best regards,<br>
      <strong style="color:#94a3b8;">The EtherAuthority DAO Team</strong>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority DAO" <${process.env.SMTP_USER}>`,
      to,
      subject: "DAO Application Received - EtherAuthority",
      html: baseLayout(
        "&#127775;",
        "DAO Application Received",
        "Thank you for applying to join the EtherAuthority DAO",
        bodyContent,
      ),
    });
    console.log("DAO thank you email sent to:", to);
  } catch (error) {
    console.error("Failed to send DAO thank you email:", error);
  }
}

export async function sendDaoApprovalEmail(
  to: string,
  name: string,
  password: string,
  position: string,
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("Email not configured, skipping DAO approval email to:", to);
    return;
  }

  const bodyContent = `
    <p style="color:#e2e8f0;font-size:16px;line-height:1.7;margin:0 0 20px;">
      Hello <strong style="color:#ffffff;">${name}</strong>,
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 8px;">
      Congratulations! Your DAO application for the <strong style="color:#ffffff;">${position}</strong> position has been <strong style="color:#10b981;">approved</strong>.
    </p>
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Welcome to the EtherAuthority DAO. You now have access to the intern panel where you can browse and select projects across all categories.
    </p>

    ${makeCredentialBox([
      { label: "Login Email", value: to },
      { label: "Default Password", value: password },
    ])}

    ${makeAlert("<strong>Important:</strong> Please change your default password after your first login for security.", "warning")}

    <div style="text-align:center;padding:8px 0 16px;">
      ${makeButton("Login to DAO Panel &rarr;", `${getAppUrl()}/dao/login`, "#10b981")}
    </div>

    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:24px 0 0;">
      As a DAO member, you can pick up any available project across all categories and start contributing right away.
    </p>
    <p style="color:#64748b;font-size:14px;margin:20px 0 0;">
      Best regards,<br>
      <strong style="color:#94a3b8;">The EtherAuthority DAO Team</strong>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority DAO" <${process.env.SMTP_USER}>`,
      to,
      subject: "Welcome to the EtherAuthority DAO - Your Login Credentials",
      html: baseLayout(
        "&#9989;",
        "DAO Application Approved!",
        "Welcome to the EtherAuthority DAO",
        bodyContent,
        "#10b981",
      ),
    });
    console.log("DAO approval email sent to:", to);
  } catch (error) {
    console.error("Failed to send DAO approval email:", error);
  }
}

export async function sendContactNotificationEmail(
  firstName: string,
  lastName: string,
  email: string,
  subject: string,
  message: string,
): Promise<void> {
  const bodyContent = `
    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
      A new message has been received through the contact form on the website.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;background:linear-gradient(135deg,#1e1b4b 0%,#172035 100%);border:1px solid rgba(139,92,246,0.2);margin:0 0 24px;">
      <tr>
        <td style="padding:20px;border-bottom:1px solid rgba(139,92,246,0.12);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:90px;vertical-align:top;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">From</span>
              </td>
              <td>
                <span style="font-size:16px;font-weight:700;color:#e2e8f0;">${firstName} ${lastName}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;border-bottom:1px solid rgba(139,92,246,0.12);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:90px;vertical-align:top;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Email</span>
              </td>
              <td>
                <a href="mailto:${email}" style="font-size:15px;color:#8b5cf6;text-decoration:none;">${email}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;border-bottom:1px solid rgba(139,92,246,0.12);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:90px;vertical-align:top;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Subject</span>
              </td>
              <td>
                <span style="font-size:15px;font-weight:600;color:#e2e8f0;">${subject}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <span style="display:block;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Message</span>
          <div style="font-size:15px;color:#cbd5e1;line-height:1.7;white-space:pre-wrap;background:#0f172a;padding:16px;border-radius:8px;border:1px solid rgba(139,92,246,0.1);">${message}</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;padding:8px 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td align="center" style="border-radius:10px;background:linear-gradient(135deg,#a855f7 0%,#7c3aed 100%);box-shadow:0 4px 16px rgba(168,85,247,0.3);">
            <a href="mailto:${email}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
              Reply to ${firstName} &rarr;
            </a>
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: `"EtherAuthority Internships" <${process.env.SMTP_USER}>`,
    to: "marketing@scaiworld.org",
    subject: `New Contact Form Submission: ${subject}`,
    html: baseLayout(
      "&#9993;",
      "New Contact Message",
      `${firstName} ${lastName} sent a message via the website`,
      bodyContent,
    ),
  });
  console.log("Contact notification email sent");
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInternActionEmail(
  toEmail: string,
  internName: string,
  actionType: "warning" | "rejection",
  note: string,
  adminUsername: string,
): Promise<{ sent: boolean; error?: string }> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("SMTP not configured - skipping intern action email");
    return { sent: false, error: "SMTP not configured" };
  }

  const isRejection = actionType === "rejection";
  const accentColor = isRejection ? "#ef4444" : "#f59e0b";
  const headerIcon = isRejection ? "&#10006;" : "&#9888;&#65039;";
  const headerTitle = isRejection
    ? "Internship Status Update"
    : "Important: Warning Notice";
  const headerSubtitle = isRejection
    ? "Your internship has been discontinued"
    : "Please review the message from the EtherAuthority team";
  const subject = isRejection
    ? "EtherAuthority Internship - Status Update"
    : "EtherAuthority Internship - Warning Notice";

  const safeName = escapeHtml(internName || "Intern");
  const safeAdmin = escapeHtml(adminUsername || "Admin");
  const escapedNote = escapeHtml(note).replace(/\n/g, "<br/>");

  const intro = isRejection
    ? `Dear ${safeName},<br/><br/>We regret to inform you that, after careful consideration, your participation in the EtherAuthority Internship Program has been <strong style="color:#fca5a5;">discontinued</strong>, effective immediately. The reason provided by the administrator is included below.`
    : `Dear ${safeName},<br/><br/>This message is to formally notify you that the EtherAuthority Internship team has issued a <strong style="color:#fbbf24;">warning</strong> regarding your participation in the program. Please read the details carefully and take corrective action.`;

  const closing = isRejection
    ? `Your access to the intern panel may be revoked. If you believe this decision was made in error, you may reply to this notice by contacting our team through the official channels listed below. We wish you the best in your future endeavors.`
    : `Please treat this notice seriously. Repeated issues may result in further action, including discontinuation from the program. If you have any questions or wish to discuss this matter, please contact us through the official channels.`;

  const noteBlock = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-radius:12px;background:linear-gradient(135deg,#1e1b4b 0%,#172035 100%);border:1px solid ${accentColor}40;">
      <tr>
        <td style="padding:18px 22px;border-bottom:1px solid ${accentColor}30;">
          <span style="display:block;font-size:11px;color:${accentColor};text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Message From Administrator</span>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 22px;">
          <p style="margin:0;font-size:15px;color:#e2e8f0;line-height:1.7;white-space:pre-wrap;">${escapedNote}</p>
        </td>
      </tr>
    </table>
  `;

  const bodyContent = `
    <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.7;">${intro}</p>
    ${noteBlock}
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.7;">${closing}</p>
    ${
      isRejection
        ? makeAlert(
            "This action was taken on " +
              new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) +
              ".",
            "info",
          )
        : makeAlert(
            "Please address the above feedback at the earliest. Continued non-compliance may lead to removal from the internship program.",
            "warning",
          )
    }
    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
      Issued by: <strong style="color:#94a3b8;">${safeAdmin}</strong><br/>
      EtherAuthority Internship Team
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"EtherAuthority Internships" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html: baseLayout(headerIcon, headerTitle, headerSubtitle, bodyContent, accentColor),
    });
    console.log(`Intern ${actionType} email sent to ${toEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.error(`Failed to send intern ${actionType} email to ${toEmail}:`, err);
    return { sent: false, error: err?.message || "Email send failed" };
  }
}
