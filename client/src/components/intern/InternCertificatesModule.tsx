import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  Download,
  FileText,
  Loader2,
  Lock,
  X,
  Printer,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Certificate } from "@shared/schema";
import logoPath from "@assets/logo.png";

const CERT_TYPE_LABELS: Record<string, string> = {
  training: "Training Completion Certificate",
  internship: "Certificate of Internship",
  offer_letter: "Internship Offer Letter",
  completion_letter: "Internship Completion Letter",
  training_offer_letter: "Training Offer Letter",
};

type CertCategoryText = { role: string; program: string; description: string };

const CERT_TYPE_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  training: "default",
  internship: "secondary",
  offer_letter: "outline",
  completion_letter: "secondary",
  training_offer_letter: "outline",
};

function CertificateContent({
  type,
  certText,
}: {
  type: string;
  certText?: CertCategoryText;
}) {
  const ct = certText || {
    role: "Web3 & Blockchain Development Intern",
    program: "Web3 & Blockchain Programming Training course",
    description:
      "Web3 technologies, blockchain fundamentals, smart contract development, and decentralized application (dApp) architecture",
  };
  if (type === "offer_letter") {
    return {
      title: "OFFER",
      subtitle: "Letter of Internship",
      body1: (
        <>
          is hereby offered the position of{" "}
          <strong style={{ color: "#0D47A1" }}>{ct.role}</strong> at{" "}
          <strong style={{ color: "#0D47A1" }}>EtherAuthority</strong>.
        </>
      ),
      body2: `This offer is extended in recognition of the candidate's successful completion of the required training program and demonstrated proficiency in ${ct.description}.`,
      closing:
        "The internship shall commence on the date specified above and is subject to the terms and conditions agreed upon.",
    };
  }
  return {
    title: "CERTIFICATE",
    subtitle: "of Achievement",
    body1: (
      <>
        has formally completed the{" "}
        <strong style={{ color: "#0D47A1" }}>{ct.program}</strong> conducted by{" "}
        <strong style={{ color: "#0D47A1" }}>EtherAuthority</strong>.
      </>
    ),
    body2: `Throughout the program, the participant consistently demonstrated dedication, strong technical proficiency, and a clear understanding of ${ct.description}.`,
    closing:
      "This certificate is awarded in recognition of the successful completion of all prescribed training modules and program requirements.",
  };
}

function LogoImg({
  size = 68,
  wide = false,
}: {
  size?: number;
  wide?: boolean;
}) {
  return (
    <img
      src={logoPath}
      alt="EtherAuthority"
      style={{
        height: `${size}px`,
        width: wide ? "auto" : `${size}px`,
        maxWidth: wide ? `${size * 3.5}px` : `${size}px`,
        objectFit: "contain",
      }}
    />
  );
}

function TrainingCertificateTemplate({
  cert,
  certText,
}: {
  cert: Certificate;
  certText: CertCategoryText;
}) {
  const currentYear = cert.issuedAt
    ? new Date(cert.issuedAt).getFullYear()
    : new Date().getFullYear();
  const content = CertificateContent({ type: cert.type, certText });
  const nameLength = (cert.internName || "").length;
  const nameFontSize =
    nameLength > 30 ? "26px" : nameLength > 22 ? "30px" : "34px";

  return (
    <div
      style={{
        width: "794px",
        height: "800px",
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily:
          "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
        color: "#1e293b",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "14px",
          border: "2.5px solid #1565C0",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "20px",
          border: "0.5px solid #90CAF9",
          pointerEvents: "none",
        }}
      />

      <svg
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          width: "100px",
          height: "100px",
          opacity: 0.06,
        }}
        viewBox="0 0 100 100"
      >
        <path
          d="M0,0 Q50,20 100,0 Q80,50 100,100 Q50,80 0,100 Q20,50 0,0 Z"
          fill="#1565C0"
        />
      </svg>
      <svg
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          width: "100px",
          height: "100px",
          opacity: 0.06,
        }}
        viewBox="0 0 100 100"
      >
        <path
          d="M0,0 Q50,20 100,0 Q80,50 100,100 Q50,80 0,100 Q20,50 0,0 Z"
          fill="#1565C0"
        />
      </svg>
      <svg
        style={{
          position: "absolute",
          bottom: "14px",
          left: "14px",
          width: "100px",
          height: "100px",
          opacity: 0.06,
        }}
        viewBox="0 0 100 100"
      >
        <path
          d="M0,0 Q50,20 100,0 Q80,50 100,100 Q50,80 0,100 Q20,50 0,0 Z"
          fill="#1565C0"
        />
      </svg>
      <svg
        style={{
          position: "absolute",
          bottom: "14px",
          right: "14px",
          width: "100px",
          height: "100px",
          opacity: 0.06,
        }}
        viewBox="0 0 100 100"
      >
        <path
          d="M0,0 Q50,20 100,0 Q80,50 100,100 Q50,80 0,100 Q20,50 0,0 Z"
          fill="#1565C0"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          top: "30px",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 0,
        }}
      >
        <svg
          width="700"
          height="60"
          viewBox="0 0 700 60"
          style={{ display: "inline-block", opacity: 0.04 }}
        >
          <path
            d="M0,30 Q175,0 350,30 Q525,60 700,30"
            fill="none"
            stroke="#1565C0"
            strokeWidth="40"
          />
        </svg>
      </div>

      <div
        style={{
          padding: "36px 70px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2px" }}>
          <LogoImg size={50} wide />
        </div>

        <div style={{ textAlign: "center", marginBottom: "2px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "400",
              color: "#0D47A1",
              letterSpacing: "4px",
              textTransform: "uppercase",
              lineHeight: "1.15",
              margin: 0,
            }}
          >
            {content.title.charAt(0)}
            <span style={{ fontSize: "28px" }}>{content.title.slice(1)}</span>
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#1976D2",
              letterSpacing: "6px",
              textTransform: "uppercase",
              fontWeight: "400",
              marginTop: "1px",
            }}
          >
            {content.subtitle}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            margin: "6px auto 10px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "1px",
              background: "linear-gradient(to right, transparent, #B0BEC5)",
            }}
          />
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path
              d="M8,0 L10,6 L16,8 L10,10 L8,16 L6,10 L0,8 L6,6 Z"
              fill="#C5A55A"
            />
          </svg>
          <div
            style={{
              width: "80px",
              height: "1px",
              background: "linear-gradient(to left, transparent, #B0BEC5)",
            }}
          />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#546E7A",
            fontStyle: "italic",
            marginBottom: "8px",
          }}
        >
          This is to certify that
        </p>

        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div
            style={{
              display: "inline-block",
              position: "relative",
              padding: "2px 50px 8px",
            }}
          >
            <h2
              style={{
                fontSize: nameFontSize,
                fontWeight: "700",
                color: "#0D47A1",
                letterSpacing: "1.5px",
                margin: 0,
                fontFamily:
                  "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
                maxWidth: "550px",
                wordBreak: "break-word",
              }}
            >
              {cert.internName || "Intern Name"}
            </h2>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "10%",
                right: "10%",
                height: "2px",
                background:
                  "linear-gradient(to right, transparent, #C5A55A, #D4AF37, #C5A55A, transparent)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            maxWidth: "510px",
            margin: "0 auto 8px",
          }}
        >
          <p
            style={{ fontSize: "13.5px", lineHeight: "1.8", color: "#37474F" }}
          >
            {content.body1}
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            maxWidth: "510px",
            margin: "0 auto 10px",
          }}
        >
          <p style={{ fontSize: "12px", lineHeight: "1.75", color: "#546E7A" }}>
            {content.body2}
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            margin: "0 auto 10px",
            padding: "10px 36px",
            background: "linear-gradient(135deg, #F5F9FF, #EBF2FC)",
            borderRadius: "6px",
            border: "1px solid #DBEAFE",
            maxWidth: "400px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#1976D2",
              marginBottom: "4px",
              fontWeight: "600",
              fontFamily: "Arial, sans-serif",
            }}
          >
            Program Duration
          </p>
          <p
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#0D47A1",
              margin: 0,
            }}
          >
            {cert.programStartDate || "N/A"} — {cert.programEndDate || "N/A"}
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            maxWidth: "490px",
            margin: "0 auto 6px",
          }}
        >
          <p style={{ fontSize: "12px", lineHeight: "1.7", color: "#546E7A" }}>
            {content.closing}
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            maxWidth: "490px",
            margin: "0 auto 6px",
          }}
        >
          <p style={{ fontSize: "12px", lineHeight: "1.7", color: "#546E7A" }}>
            We wish the participant continued success in future academic and
            professional endeavors.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 6px",
            marginTop: "16px",
            marginBottom: "8px",
          }}
        >
          <div style={{ textAlign: "left", width: "180px" }}>
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#1976D2",
                marginBottom: "3px",
                fontWeight: "600",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Issued by
            </p>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#0D47A1",
                marginBottom: "1px",
              }}
            >
              EtherAuthority
            </p>
            <p style={{ fontSize: "9.5px", color: "#78909C" }}>
              https://etherauthority.io
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "96px",
                height: "96px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "3px solid #C5A55A",
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "5px",
                  borderRadius: "50%",
                  border: "2px solid #0D47A1",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "10px",
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #EBF2FC, #DBEAFE)",
                  border: "1px solid #BBDEFB",
                }}
              />
              <div
                style={{ position: "relative", textAlign: "center", zIndex: 1 }}
              >
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "#0D47A1",
                    lineHeight: "1",
                    margin: 0,
                  }}
                >
                  {currentYear}
                </p>
                <div
                  style={{
                    width: "36px",
                    height: "1.5px",
                    background: "#C5A55A",
                    margin: "3px auto",
                  }}
                />
                <p
                  style={{
                    fontSize: "7.5px",
                    fontWeight: "800",
                    color: "#1976D2",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    margin: 0,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  AWARDS
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", width: "200px" }}>
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#1976D2",
                marginBottom: "2px",
                fontWeight: "600",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Authorized Signatory
            </p>
            <SignatureBlock width={160} height={45} align="right" />
            <div
              style={{
                width: "150px",
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, #C5A55A, transparent)",
                marginLeft: "auto",
                marginBottom: "5px",
              }}
            />
            <p
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#1e293b",
                margin: "0 0 1px",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Yogesh Padsala
            </p>
            <p
              style={{
                fontSize: "9.5px",
                color: "#78909C",
                margin: 0,
                fontFamily: "Arial, sans-serif",
              }}
            >
              Founder & CTO
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "0.5px",
              background: "linear-gradient(to right, transparent, #B0BEC5)",
            }}
          />
          <svg width="10" height="10" viewBox="0 0 16 16">
            <path
              d="M8,0 L10,6 L16,8 L10,10 L8,16 L6,10 L0,8 L6,6 Z"
              fill="#C5A55A"
            />
          </svg>
          <div
            style={{
              flex: 1,
              height: "0.5px",
              background: "linear-gradient(to left, transparent, #B0BEC5)",
            }}
          />
        </div>

        <div style={{ textAlign: "center", paddingBottom: "4px" }}>
          <p
            style={{
              fontSize: "8.5px",
              color: "#90A4AE",
              letterSpacing: "0.8px",
              margin: 0,
              fontFamily: "Arial, sans-serif",
            }}
          >
            Certificate ID:{" "}
            <span style={{ color: "#1565C0", fontWeight: "600" }}>
              {cert.certificateNumber || "N/A"}
            </span>
            <span style={{ margin: "0 8px", color: "#CBD5E1" }}>|</span>
            Date of Issue:{" "}
            <span style={{ color: "#1565C0", fontWeight: "600" }}>
              {cert.programEndDate ||
                (cert.issuedAt
                  ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function TrainingOfferLetterTemplate({
  cert,
  certText,
}: {
  cert: Certificate;
  certText: CertCategoryText;
}) {
  const issueDateObj = cert.issuedAt ? new Date(cert.issuedAt) : new Date();
  const startDateObj = new Date(issueDateObj.getTime() + 24 * 60 * 60 * 1000);
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const issueDate = formatDate(issueDateObj);
  const startDate = formatDate(startDateObj);
  const internName = cert.internName || "Applicant Name";
  const refNo =
    cert.certificateNumber || `EA/TRN/${issueDateObj.getFullYear()}/00`;

  const s: Record<string, React.CSSProperties> = {
    page: {
      width: "794px",
      height: "1123px",
      background: "#ffffff",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      color: "#1e293b",
      fontSize: "12.5px",
      lineHeight: "1.7",
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "5px",
      background:
        "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
    },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "5px",
      background:
        "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
    },
    border1: {
      position: "absolute",
      inset: "12px",
      border: "2px solid #1565C0",
      pointerEvents: "none",
    },
    border2: {
      position: "absolute",
      inset: "16px",
      border: "0.5px solid #90CAF9",
      pointerEvents: "none",
    },
    content: {
      padding: "32px 60px 28px",
      position: "relative",
      zIndex: 1,
    },
    heading: {
      fontSize: "22px",
      fontWeight: 700,
      color: "#0D47A1",
      textAlign: "center",
      letterSpacing: "3px",
      textTransform: "uppercase",
      margin: "0 0 18px",
      borderBottom: "2px solid #E3F2FD",
      paddingBottom: "12px",
    },
    label: { fontWeight: 700, color: "#0D47A1" },
    sectionTitle: {
      fontWeight: 700,
      color: "#1e293b",
      marginBottom: "3px",
    },
    detailsBox: {
      background: "#F5F9FF",
      border: "1px solid #E3F2FD",
      borderRadius: "6px",
      padding: "14px 18px",
      marginBottom: "16px",
    },
    detailGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      columnGap: "20px",
      rowGap: "2px",
    },
    detailRow: {
      display: "flex",
      padding: "4px 0",
      fontSize: "12.5px",
    },
    detailLabel: {
      width: "180px",
      color: "#546E7A",
      flexShrink: 0,
    },
    detailValue: {
      fontWeight: 600,
      color: "#1e293b",
    },
  };

  return (
    <div style={s.page}>
      <div style={s.topBar} />
      <div style={s.bottomBar} />
      <div style={s.border1} />
      <div style={s.border2} />

      <div style={s.content}>
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <LogoImg size={45} wide />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#546E7A",
            marginBottom: "12px",
          }}
        >
          Blockchain Security &amp; Smart Contract Auditing |
          contact@etherauthority.io
        </p>

        <h1 style={s.heading}>Training Offer Letter</h1>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "14px",
            fontSize: "11px",
          }}
        >
          <p style={{ margin: 0 }}>
            <span style={s.label}>Ref No.:</span> {refNo}
          </p>
          <p style={{ margin: 0 }}>
            <span style={s.label}>Date:</span> {issueDate}
          </p>
        </div>

        <p style={{ marginBottom: "12px" }}>
          Dear <strong style={{ color: "#0D47A1" }}>{internName}</strong>,
        </p>

        <p style={{ marginBottom: "14px", textAlign: "justify" }}>
          Congratulations and welcome to{" "}
          <strong style={{ color: "#0D47A1" }}>EtherAuthority</strong>! We are
          delighted to formally extend this offer to enroll you in our{" "}
          <strong>Internship Training Program</strong> &mdash; an intensive
          4-week program designed to prepare you for a real-world internship in
          Web3, Blockchain, AI, and modern web technologies.
        </p>

        <div style={s.detailsBox}>
          <p
            style={{
              ...s.label,
              fontSize: "11px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Training Details
          </p>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Program</span>
            <span style={s.detailValue}>
              EtherAuthority Internship Training Program
            </span>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Track</span>
            <span style={s.detailValue}>{certText.role}</span>
          </div>
          <div style={s.detailGrid}>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>Mode</span>
              <span style={s.detailValue}>Remote / Online</span>
            </div>

            <div style={s.detailRow}>
              <span style={s.detailLabel}>Tentative Start</span>
              <span style={s.detailValue}>{startDate}</span>
            </div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>Duration</span>
              <span style={s.detailValue}>4 Weeks (Self-paced)</span>
            </div>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Stipend</span>
            <span style={s.detailValue}>Unpaid (during training phase)</span>
          </div>
        </div>

        <div style={{ marginBottom: "6px" }}>
          <p style={s.sectionTitle}>1. Program Scope</p>
          <p style={{ margin: 0 }}>
            The training covers {certText.description}, delivered through
            structured modules, practical assignments, and a final qualifying
            task / direct exam.
          </p>
        </div>

        <div style={{ marginBottom: "6px" }}>
          <p style={s.sectionTitle}>2. Key Terms</p>
          <ol style={{ paddingLeft: "18px", margin: 0 }}>
            <li>
              Complete all 4-week training modules within the program duration.
            </li>
            <li>
              Submit the Week-4 task or direct exam to qualify for the paid
              internship phase.
            </li>
            <li>
              Maintain professional conduct and uphold confidentiality of
              project material.
            </li>
            <li>
              On successful training completion you will receive a Training
              Certificate, and may be considered for the paid internship phase
              subject to admin approval.
            </li>
          </ol>
        </div>

        <div style={{ marginBottom: "6px" }}>
          <p style={s.sectionTitle}>3. Nature of Engagement</p>
          <p style={{ margin: 0 }}>
            This training is educational in nature and shall not be construed as
            an offer of permanent employment or assurance of future placement.
          </p>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <p style={s.sectionTitle}>4. Acceptance</p>
          <p style={{ margin: 0 }}>
            Logging in to your Intern Portal and beginning the Week-1 modules
            will be considered acceptance of this training offer.
          </p>
        </div>

        <p style={{ margin: "0 0 10px", textAlign: "justify" }}>
          We look forward to your active participation. Best of luck with your
          training journey!
        </p>

        <div style={{ marginTop: "8px" }}>
          <p style={{ fontWeight: 700, color: "#0D47A1", margin: "0 0 2px" }}>
            For EtherAuthority
          </p>

          <SignatureBlock width={150} height={36} />

          <p style={{ fontWeight: 700, margin: "0 0 1px", fontSize: "11.5px" }}>
            Yogesh Padsala
          </p>
          <p
            style={{ fontSize: "10.5px", color: "#78909C", margin: "0 0 1px" }}
          >
            Founder &amp; CTO
          </p>
          <p style={{ fontSize: "10.5px", color: "#78909C", margin: 0 }}>
            Date: {issueDate}
          </p>
        </div>
      </div>
    </div>
  );
}

function OfferLetterTemplate({
  cert,
  certText,
}: {
  cert: Certificate;
  certText: CertCategoryText;
}) {
  // Base issue date
  const issueDateObj = cert.issuedAt ? new Date(cert.issuedAt) : new Date();

  // Start date = issue date
  const startDateObj = new Date(issueDateObj);

  // End date = +1 month
  const endDateObj = new Date(issueDateObj);
  endDateObj.setMonth(endDateObj.getMonth() + 1);

  // Format date
  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const issueDate = formatDate(issueDateObj);
  const startDate = formatDate(startDateObj);
  const endDate = formatDate(endDateObj);

  const internName = cert.internName || "Intern Name";

  const refYear = issueDateObj.getFullYear();
  const refNo = cert.certificateNumber
    ? cert.certificateNumber
        .replace("EA-WEB3-BLOCKCHAIN", "EA/INT")
        .replace(/\//g, "/")
    : `EA/INT/${refYear}/00`;

  const s: Record<string, React.CSSProperties> = {
    page: {
      width: "794px",
      minHeight: "1123px",
      background: "#ffffff",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      color: "#1e293b",
      fontSize: "12.5px",
      lineHeight: "1.7",
    },
    topBar: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      height: "5px",
      background:
        "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
    },
    bottomBar: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: "5px",
      background:
        "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
    },
    border1: {
      position: "absolute" as const,
      inset: "12px",
      border: "2px solid #1565C0",
      pointerEvents: "none" as const,
    },
    border2: {
      position: "absolute" as const,
      inset: "17px",
      border: "0.5px solid #90CAF9",
      pointerEvents: "none" as const,
    },
    content: {
      padding: "32px 60px 28px",
      position: "relative" as const,
      zIndex: 1,
    },
    heading: {
      fontSize: "22px",
      fontWeight: "700" as const,
      color: "#0D47A1",
      textAlign: "center" as const,
      letterSpacing: "3px",
      textTransform: "uppercase" as const,
      margin: "0 0 18px",
      borderBottom: "2px solid #E3F2FD",
      paddingBottom: "12px",
    },
    label: { fontWeight: "700" as const, color: "#0D47A1" },
    sectionTitle: {
      fontWeight: "700" as const,
      color: "#1e293b",
      marginBottom: "3px",
    },
  };

  return (
    <div style={s.page}>
      <div style={s.topBar} />
      <div style={s.bottomBar} />
      <div style={s.border1} />
      <div style={s.border2} />

      <div style={s.content}>
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <LogoImg size={45} wide />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#546E7A",
            marginBottom: "14px",
          }}
        >
          Blockchain Security & Smart Contract Auditing |
          contact@etherauthority.io
        </p>

        <h1 style={s.heading}>Internship Offer Letter</h1>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "18px",
            fontSize: "12px",
          }}
        >
          <p>
            <span style={s.label}>Ref No.:</span> {refNo}
          </p>
          <p>
            <span style={s.label}>Date:</span> {issueDate}
          </p>
        </div>

        <p
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#37474F",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "12px",
          }}
        >
          To Whomsoever It May Concern
        </p>

        <p style={{ marginBottom: "14px" }}>
          This is to certify that{" "}
          <strong style={{ color: "#0D47A1" }}>{internName}</strong> has been
          officially offered an internship with <strong>EtherAuthority</strong>{" "}
          under the terms and conditions stated herein.
        </p>

        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>1. Appointment</p>
          <p>
            {internName} is hereby appointed as a{" "}
            <strong>{certText.role}</strong> at EtherAuthority.
          </p>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>2. Mode of Internship</p>
          <p>
            The internship shall be conducted in a{" "}
            <strong>Remote and Online</strong> mode.
          </p>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>3. Internship Duration</p>
          <p>
            The internship shall commence on <strong>{startDate}</strong> and
            shall be valid for a period of one (1) month, concluding on{" "}
            <strong>{endDate}</strong>, unless extended or terminated earlier at
            the sole discretion of the organization.
          </p>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>4. Stipend</p>
          <p>
            The intern shall receive a stipend in SCAI Tokens, based on subject
            to satisfactory performance, attendance, and compliance with
            organizational rules.
          </p>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>5. Nature of Internship</p>
          <p>
            This internship is temporary and educational in nature and shall not
            be construed as an offer of permanent employment or assurance of
            future placement.
          </p>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>6. Roles & Responsibilities</p>
          <p>
            The intern shall work on activities related to{" "}
            {certText.description}, and related tasks as assigned by
            EtherAuthority.
          </p>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>7. Confidentiality & Code of Conduct</p>
          <p>
            The intern shall maintain strict confidentiality of all proprietary
            and business-related information of EtherAuthority during and after
            the internship period and adhere to all company policies and
            professional standards.
          </p>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <p style={s.sectionTitle}>8. Certification</p>
          <p>
            Upon successful completion of the internship, an Internship
            Completion Certificate shall be issued by EtherAuthority.
          </p>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <p style={s.sectionTitle}>9. Governing Law</p>
          <p>
            This offer letter shall be governed by and interpreted in accordance
            with the laws of India.
          </p>
        </div>

        <div style={{ marginBottom: "24px", marginTop: "20px" }}>
          <p style={{ fontWeight: "700", color: "#0D47A1" }}>
            For EtherAuthority
          </p>

          <SignatureBlock width={180} height={50} />

          <p style={{ fontWeight: "700" }}>Yogesh Padsala</p>
          <p style={{ fontSize: "12px", color: "#78909C" }}>Founder & CTO</p>
          <p style={{ fontSize: "12px", color: "#78909C" }}>
            Date: {issueDate}
          </p>
        </div>
      </div>
    </div>
  );
}
function SignatureBlock({
  width = 200,
  height = 60,
  align = "left",
}: {
  width?: number;
  height?: number;
  align?: "left" | "right";
}) {
  const wrapStyle: React.CSSProperties =
    align === "right" ? { display: "flex", justifyContent: "flex-end" } : {};
  return (
    <div style={wrapStyle}>
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily:
              "'Great Vibes', 'Dancing Script', 'Segoe Script', cursive",
            fontSize: `${Math.round(height * 0.5)}px`,
            color: "#0D47A1",
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: "0.5px",
            userSelect: "none",
          }}
        >
          Yogesh Padsala
        </span>
      </div>
    </div>
  );
}

function InternshipCertificateTemplate({
  cert,
  certText,
}: {
  cert: Certificate;
  certText: CertCategoryText;
}) {
  const internName = cert.internName || "Intern Name";
  const startDate = cert.programStartDate || "N/A";
  const endDate = cert.programEndDate || "N/A";
  const issueDate =
    cert.programEndDate ||
    (cert.issuedAt
      ? new Date(cert.issuedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "N/A");

  return (
    <div
      style={{
        width: "794px",
        minHeight: "923px",
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: "#2d3748",
        fontSize: "13px",
        lineHeight: "1.75",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "4px",
          background: "linear-gradient(to bottom, #0D47A1, #42A5F5, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "4px",
          background: "linear-gradient(to bottom, #0D47A1, #42A5F5, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "9px",
          border: "1.5px solid #1976D2",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "13px",
          border: "0.5px solid #BBDEFB",
          pointerEvents: "none",
        }}
      />

      <svg
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "380px",
          height: "380px",
          opacity: 0.025,
        }}
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
          fill="#0D47A1"
        />
      </svg>

      <div
        style={{ padding: "28px 55px 24px", position: "relative", zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: "2px" }}>
          <LogoImg size={44} wide />
        </div>
        <div style={{ textAlign: "center", marginBottom: "2px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0D47A1",
              margin: 0,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            EtherAuthority
          </h2>
          <p
            style={{
              fontSize: "9px",
              color: "#546E7A",
              margin: "1px 0 0",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            Blockchain Security &amp; Smart Contract Auditing
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "8px 0 10px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1.5px",
              background: "linear-gradient(to right, transparent, #0D47A1)",
            }}
          />
          <svg width="10" height="10" viewBox="0 0 16 16">
            <path
              d="M8,0 L10,6 L16,8 L10,10 L8,16 L6,10 L0,8 L6,6 Z"
              fill="#C5A55A"
            />
          </svg>
          <div
            style={{
              flex: 1,
              height: "1.5px",
              background: "linear-gradient(to left, transparent, #0D47A1)",
            }}
          />
        </div>

        <div
          style={{ textAlign: "center", marginBottom: "2px", padding: "6px 0" }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#0D47A1",
              letterSpacing: "3px",
              textTransform: "uppercase",
              margin: 0,
              fontFamily:
                "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
            }}
          >
            Certificate of Internship
          </h1>
          <div
            style={{
              width: "180px",
              height: "2px",
              background:
                "linear-gradient(to right, transparent, #C5A55A, #D4AF37, #C5A55A, transparent)",
              margin: "5px auto 0",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              background: "#F5F9FF",
              border: "1px solid #E3F2FD",
              borderRadius: "4px",
              padding: "3px 12px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "#1565C0",
                margin: 0,
                fontWeight: "600",
              }}
            >
              Date: {issueDate}
            </p>
          </div>
        </div>

        <p style={{ marginBottom: "10px", textAlign: "justify" }}>
          This is to certify that{" "}
          <strong style={{ color: "#0D47A1" }}>{internName}</strong> has
          successfully completed a one-month internship as a{" "}
          <strong style={{ color: "#0D47A1" }}>{certText.role}</strong> at{" "}
          <strong style={{ color: "#0D47A1" }}>EtherAuthority</strong> from{" "}
          <strong>{startDate}</strong> to <strong>{endDate}</strong>. The
          internship was conducted in remote mode (Work From Home).
        </p>

        <p style={{ marginBottom: "10px", textAlign: "justify" }}>
          During the internship, the intern demonstrated exceptional technical
          proficiency, a strong learning attitude, and consistent dedication to
          delivering quality work across multiple projects.
        </p>

        <p style={{ marginBottom: "6px", fontWeight: "600", color: "#1e293b" }}>
          Key contributions and learning areas included:
        </p>

        <ul
          style={{
            marginBottom: "10px",
            paddingLeft: "22px",
            listStyle: "square",
          }}
        >
          <li
            style={{
              marginBottom: "4px",
              paddingLeft: "3px",
              listStyle: "square",
            }}
          >
            Working on {certText.description}
          </li>
          <li
            style={{
              marginBottom: "4px",
              paddingLeft: "3px",
              listStyle: "square",
            }}
          >
            Completing assigned tasks and projects with quality and dedication
          </li>
          <li
            style={{
              marginBottom: "4px",
              paddingLeft: "3px",
              listStyle: "square",
            }}
          >
            Applying learned concepts to practical use cases and real-world
            scenarios
          </li>
          <li
            style={{
              marginBottom: "4px",
              paddingLeft: "3px",
              listStyle: "square",
            }}
          >
            Collaborating with team members to achieve project objectives and
            deadlines
          </li>
        </ul>

        <p style={{ marginBottom: "10px", textAlign: "justify" }}>
          We appreciate the intern's sincerity, commitment, and professional
          behavior throughout the internship. This certificate is awarded in
          recognition of the successful completion of all assigned projects,
          deliverables, and professional requirements.
        </p>

        <p style={{ marginBottom: "10px", textAlign: "justify" }}>
          We wish great success in future career and academic endeavors.
        </p>

        <p style={{ marginBottom: "4px" }}>Thank you.</p>
        <p style={{ marginBottom: "2px", fontWeight: "600" }}>
          Yours sincerely,
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: "6px",
          }}
        >
          <div>
            <SignatureBlock width={160} height={42} />
            <div
              style={{
                width: "140px",
                height: "1.5px",
                background: "linear-gradient(to right, #C5A55A, transparent)",
                marginBottom: "3px",
              }}
            />
            <p
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#0D47A1",
                margin: "0 0 1px",
              }}
            >
              Yogesh Padsala
            </p>
            <p
              style={{ fontSize: "11px", color: "#546E7A", margin: "0 0 0px" }}
            >
              Yogesh Padsala | Founder & CTO
            </p>
            <p style={{ fontSize: "11px", color: "#546E7A", margin: 0 }}>
              EtherAuthority
            </p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "70px",
                height: "70px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "2px solid #C5A55A",
                  opacity: 0.35,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "3px",
                  borderRadius: "50%",
                  border: "1.5px solid #0D47A1",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "7px",
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #F5F9FF, #E3F2FD)",
                  border: "1px solid #BBDEFB",
                }}
              />
              <div
                style={{ position: "relative", textAlign: "center", zIndex: 1 }}
              >
                <p
                  style={{
                    fontSize: "6px",
                    fontWeight: "800",
                    color: "#1976D2",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    margin: 0,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  Verified
                </p>
                <div
                  style={{
                    width: "24px",
                    height: "1px",
                    background: "#C5A55A",
                    margin: "2px auto",
                  }}
                />
                <p
                  style={{
                    fontSize: "6px",
                    fontWeight: "700",
                    color: "#0D47A1",
                    margin: 0,
                    fontFamily: "Arial, sans-serif",
                    letterSpacing: "1px",
                  }}
                >
                  EA
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "14px 0 6px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "0.5px",
              background: "linear-gradient(to right, transparent, #CBD5E1)",
            }}
          />
          <svg width="7" height="7" viewBox="0 0 16 16">
            <path
              d="M8,0 L10,6 L16,8 L10,10 L8,16 L6,10 L0,8 L6,6 Z"
              fill="#C5A55A"
            />
          </svg>
          <div
            style={{
              flex: 1,
              height: "0.5px",
              background: "linear-gradient(to left, transparent, #CBD5E1)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <p
            style={{
              fontSize: "8.5px",
              color: "#94a3b8",
              lineHeight: "1.5",
              maxWidth: "400px",
              margin: 0,
            }}
          >
            PS: This is a computer generated document and no physical signature
            is required. To verify authenticity of this document, please contact
            us at: contact@etherauthority.io
          </p>
          <p
            style={{
              fontSize: "7.5px",
              color: "#94a3b8",
              margin: 0,
              textAlign: "right",
            }}
          >
            Ref: {cert.certificateNumber || "N/A"}
            <br />
            Date: {issueDate}
          </p>
        </div>
      </div>
    </div>
  );
}

function CompletionLetterTemplate({
  cert,
  certText,
}: {
  cert: Certificate;
  certText: CertCategoryText;
}) {
  const internName = cert.internName || "Intern Name";
  const startDate = cert.programStartDate || "N/A";
  const endDate = cert.programEndDate || "N/A";
  const issueDate =
    cert.programEndDate ||
    (cert.issuedAt
      ? new Date(cert.issuedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "N/A");

  return (
    <div
      style={{
        width: "794px",
        minHeight: "623px",
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: "#2d3748",
        fontSize: "13px",
        lineHeight: "1.75",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            "linear-gradient(to right, #0D47A1, #1976D2, #42A5F5, #1976D2, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "4px",
          background: "linear-gradient(to bottom, #0D47A1, #42A5F5, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "4px",
          background: "linear-gradient(to bottom, #0D47A1, #42A5F5, #0D47A1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "9px",
          border: "1.5px solid #1976D2",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "13px",
          border: "0.5px solid #BBDEFB",
          pointerEvents: "none",
        }}
      />

      <svg
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "350px",
          height: "350px",
          opacity: 0.02,
        }}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#0D47A1"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="#0D47A1"
          strokeWidth="0.5"
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="16"
          fontWeight="bold"
          fill="#0D47A1"
        >
          EA
        </text>
      </svg>

      <div
        style={{ padding: "28px 55px 24px", position: "relative", zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: "2px" }}>
          <LogoImg size={44} wide />
        </div>
        <div style={{ textAlign: "center", marginBottom: "2px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0D47A1",
              margin: 0,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            EtherAuthority
          </h2>
          <p
            style={{
              fontSize: "9px",
              color: "#546E7A",
              margin: "1px 0 0",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            Blockchain Security &amp; Smart Contract Auditing
          </p>
          <p
            style={{
              fontSize: "8px",
              color: "#90A4AE",
              margin: "1px 0 0",
              letterSpacing: "0.5px",
            }}
          >
            https://etherauthority.io &nbsp;|&nbsp; contact@etherauthority.io
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "8px 0 10px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1.5px",
              background: "linear-gradient(to right, transparent, #0D47A1)",
            }}
          />
          <svg width="10" height="10" viewBox="0 0 16 16">
            <path
              d="M8,0 L10,6 L16,8 L10,10 L8,16 L6,10 L0,8 L6,6 Z"
              fill="#C5A55A"
            />
          </svg>
          <div
            style={{
              flex: 1,
              height: "1.5px",
              background: "linear-gradient(to left, transparent, #0D47A1)",
            }}
          />
        </div>

        <div
          style={{ textAlign: "center", marginBottom: "2px", padding: "6px 0" }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#0D47A1",
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              margin: 0,
              fontFamily:
                "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
            }}
          >
            Internship Completion Letter
          </h1>
          <div
            style={{
              width: "180px",
              height: "2px",
              background:
                "linear-gradient(to right, transparent, #C5A55A, #D4AF37, #C5A55A, transparent)",
              margin: "5px auto 0",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              background: "#F5F9FF",
              border: "1px solid #E3F2FD",
              borderRadius: "4px",
              padding: "3px 12px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "#1565C0",
                margin: 0,
                fontWeight: "600",
              }}
            >
              Date: {issueDate}
            </p>
          </div>
        </div>

        <p style={{ marginBottom: "10px", textAlign: "justify" }}>
          This is to certify that{" "}
          <strong style={{ color: "#0D47A1" }}>{internName}</strong> has
          successfully completed the internship as a{" "}
          <strong style={{ color: "#0D47A1" }}>{certText.role}</strong> from{" "}
          <strong>{startDate}</strong> to <strong>{endDate}</strong>. The
          internship was conducted in remote mode (Work From Home).
        </p>

        <p style={{ marginBottom: "10px", textAlign: "justify" }}>
          During the internship period, the intern actively contributed to
          multiple projects and demonstrated strong technical skills,
          dedication, and a positive learning attitude.
        </p>

        <p style={{ marginBottom: "6px", fontWeight: "600", color: "#1e293b" }}>
          Key responsibilities and learning areas included:
        </p>

        <ul style={{ marginBottom: "12px", paddingLeft: "22px" }}>
          <li
            style={{
              marginBottom: "4px",
              paddingLeft: "3px",
              listStyle: "square",
            }}
          >
            Working on {certText.description}
          </li>
          <li
            style={{
              marginBottom: "4px",
              paddingLeft: "3px",
              listStyle: "square",
            }}
          >
            Testing and ensuring proper functionality of web applications
          </li>
          <li
            style={{
              marginBottom: "4px",
              paddingLeft: "3px",
              listStyle: "square",
            }}
          >
            Collaborating with team members to achieve project objectives and
            deadlines
          </li>
        </ul>

        <p style={{ marginBottom: "10px", textAlign: "justify" }}>
          We appreciate the intern's sincerity, commitment, and professional
          behavior throughout the internship. We wish great success in future
          career and academic endeavors.
        </p>

        <p style={{ marginBottom: "4px" }}>Thank you.</p>
        <p style={{ marginBottom: "2px", fontWeight: "600" }}>
          Yours sincerely,
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: "6px",
          }}
        >
          <div>
            <SignatureBlock width={160} height={42} />
            <div
              style={{
                width: "140px",
                height: "1.5px",
                background: "linear-gradient(to right, #C5A55A, transparent)",
                marginBottom: "3px",
              }}
            />
            <p
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#0D47A1",
                margin: "0 0 1px",
              }}
            >
              Yogesh Padsala
            </p>
            <p
              style={{ fontSize: "11px", color: "#546E7A", margin: "0 0 0px" }}
            >
              Yogesh Padsala | Founder & CTO
            </p>
            <p style={{ fontSize: "11px", color: "#546E7A", margin: 0 }}>
              EtherAuthority
            </p>
          </div>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "70px",
                height: "70px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "2px solid #C5A55A",
                  opacity: 0.35,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "3px",
                  borderRadius: "50%",
                  border: "1.5px solid #0D47A1",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "7px",
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #F5F9FF, #E3F2FD)",
                  border: "1px solid #BBDEFB",
                }}
              />
              <div
                style={{ position: "relative", textAlign: "center", zIndex: 1 }}
              >
                <p
                  style={{
                    fontSize: "6px",
                    fontWeight: "800",
                    color: "#1976D2",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    margin: 0,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  Verified
                </p>
                <div
                  style={{
                    width: "24px",
                    height: "1px",
                    background: "#C5A55A",
                    margin: "2px auto",
                  }}
                />
                <p
                  style={{
                    fontSize: "6px",
                    fontWeight: "700",
                    color: "#0D47A1",
                    margin: 0,
                    fontFamily: "Arial, sans-serif",
                    letterSpacing: "1px",
                  }}
                >
                  EA
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "14px 0 6px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "0.5px",
              background: "linear-gradient(to right, transparent, #CBD5E1)",
            }}
          />
          <svg width="7" height="7" viewBox="0 0 16 16">
            <path
              d="M8,0 L10,6 L16,8 L10,10 L8,16 L6,10 L0,8 L6,6 Z"
              fill="#C5A55A"
            />
          </svg>
          <div
            style={{
              flex: 1,
              height: "0.5px",
              background: "linear-gradient(to left, transparent, #CBD5E1)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <p
            style={{
              fontSize: "8.5px",
              color: "#94a3b8",
              lineHeight: "1.5",
              maxWidth: "400px",
              margin: 0,
            }}
          >
            PS: This is a computer generated document and no physical signature
            is required. To verify authenticity of this document, please contact
            us at: contact@etherauthority.io
          </p>
          <p
            style={{
              fontSize: "7.5px",
              color: "#94a3b8",
              margin: 0,
              textAlign: "right",
            }}
          >
            Ref: {cert.certificateNumber || "N/A"}
            <br />
            Date: {issueDate}
          </p>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_CERT_TEXT: Record<
  string,
  { role: string; program: string; description: string }
> = {
  "Web3+AI": {
    role: "Web3 & Blockchain Development Intern",
    program: "Web3 & Blockchain Programming Training course",
    description:
      "Web3 technologies, blockchain fundamentals, smart contract development, and decentralized application (dApp) architecture",
  },
  "Digital Marketing": {
    role: "Digital Marketing Intern",
    program: "Digital Marketing Training course",
    description:
      "digital marketing strategies, SEO, social media marketing, content creation, and paid advertising",
  },
  "Graphics Design": {
    role: "Graphics Design Intern",
    program: "Graphics Design Training course",
    description:
      "graphic design principles, UI/UX design, brand design, and visual communication",
  },
  "Business Development": {
    role: "Business Development Intern",
    program: "Business Development Training course",
    description:
      "business strategy, growth hacking, digital marketing, and client outreach",
  },
  DAO: {
    role: "DAO Governance Intern",
    program: "DAO Governance Training course",
    description:
      "decentralized autonomous organization governance, proposal management, and community coordination",
  },
};

function getCertCategoryText(
  categoryName: string | null,
  subcategoryName?: string | null,
) {
  const base =
    (categoryName && CATEGORY_CERT_TEXT[categoryName]) ||
    (categoryName
      ? {
          role: `${categoryName} Intern`,
          program: `${categoryName} Training course`,
          description: `${categoryName.toLowerCase()} concepts, tools, and practical workflows`,
        }
      : CATEGORY_CERT_TEXT["Web3+AI"]);

  if (subcategoryName) {
    return {
      role: `${subcategoryName} Intern`,
      program: `${categoryName ?? base.role} - ${subcategoryName} Training course`,
      description: `${subcategoryName.toLowerCase()} within ${
        categoryName ? categoryName.toLowerCase() : base.description
      }`,
    };
  }

  return base;
}

export default function InternCertificatesModule() {
  const { toast } = useToast();
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  const { data: certificates = [], isLoading: certsLoading } = useQuery<
    Certificate[]
  >({
    queryKey: ["/api/intern/certificates"],
    queryFn: async () => {
      const res = await fetch("/api/intern/certificates", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch certificates");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/intern/profile"],
    queryFn: async () => {
      const res = await fetch("/api/intern/profile", {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: allCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: status } = useQuery<any>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    },
  });

  const internCategoryName = (() => {
    if (status?.categoryName) return status.categoryName as string;
    if (!profile?.categoryId) return null;
    const cat = allCategories.find((c: any) => c.id === profile.categoryId);
    return cat?.name || null;
  })();

  const internSubcategoryName: string | null = status?.subcategoryName || null;

  const certText = getCertCategoryText(
    internCategoryName,
    internSubcategoryName,
  );

  const { data: progressSummary } = useQuery<{
    total: number;
    completed: number;
    percentage: number;
  }>({
    queryKey: ["/api/intern/progress-summary"],
    queryFn: async () => {
      const res = await fetch("/api/intern/progress-summary", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  const { data: internshipProgress } = useQuery<{
    totalProjects: number;
    completedProjects: number;
    totalSubProjects: number;
    completedSubProjects: number;
    percentage: number;
  }>({
    queryKey: ["/api/intern/internship-progress"],
    queryFn: async () => {
      const res = await fetch("/api/intern/internship-progress", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch internship progress");
      return res.json();
    },
    enabled:
      status?.internshipStatus === "internship" ||
      status?.internshipStatus === "completed",
  });

  // Hours requirement disabled
  // const { data: timeLogs = [] } = useQuery<any[]>({ ... });
  // const totalMinutesLogged = ...;
  // const totalHoursLogged = ...;

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await fetch("/api/intern/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to generate certificate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/certificates"] });
      toast({ title: "Certificate generated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot generate certificate yet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const existingTypes = new Set(certificates.map((c) => c.type));
  const courseComplete = (progressSummary?.percentage ?? 0) >= 100;

  // Hours requirement disabled
  const trainingHoursComplete = true;
  const internshipHoursComplete = true;

  const canGenerateTraining = courseComplete && !existingTypes.has("training");
  // Admin must approve the intern (status='internship') before the offer
  // letter is available. Admin approval auto-issues it, so this button is
  // typically just a fallback.
  const canGenerateOfferLetter =
    courseComplete &&
    (status?.internshipStatus === "internship" ||
      status?.internshipStatus === "completed") &&
    !existingTypes.has("offer_letter");
  const internshipProjectsComplete =
    (internshipProgress?.percentage ?? 0) >= 100;
  const canGenerateInternship =
    courseComplete &&
    (status?.internshipStatus === "internship" ||
      status?.internshipStatus === "completed") &&
    internshipProjectsComplete &&
    !existingTypes.has("internship");
  const canGenerateCompletionLetter =
    courseComplete &&
    status?.internshipStatus === "completed" &&
    !existingTypes.has("completion_letter");

  const handlePrint = () => {
    if (!certRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to download the certificate",
        variant: "destructive",
      });
      return;
    }
    const printTitle =
      viewingCert?.type === "offer_letter"
        ? "Offer Letter - EtherAuthority"
        : viewingCert?.type === "training_offer_letter"
          ? "Training Offer Letter - EtherAuthority"
          : viewingCert?.type === "completion_letter"
            ? "Completion Letter - EtherAuthority"
            : "Certificate - EtherAuthority";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${printTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
          @media print {
            body { background: #fff; }
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${certRef.current.innerHTML}
        <div class="no-print" style="position:fixed;bottom:20px;right:20px;z-index:100;">
          <button onclick="window.print()" style="padding:12px 24px;background:#1565C0;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (certsLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-testid="certificates-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (viewingCert) {
    return (
      <div className="space-y-4" data-testid="certificate-view">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold">
            {viewingCert.type === "completion_letter"
              ? "Completion Letter"
              : viewingCert.type === "offer_letter"
                ? "Offer Letter"
                : viewingCert.type === "training_offer_letter"
                  ? "Training Offer Letter"
                  : "Certificate"}{" "}
            Preview
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              data-testid="button-print-cert"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewingCert(null)}
              data-testid="button-close-cert"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        <div className="flex justify-center overflow-auto pb-8" ref={certRef}>
          {viewingCert.type === "offer_letter" ? (
            <OfferLetterTemplate cert={viewingCert} certText={certText} />
          ) : viewingCert.type === "training_offer_letter" ? (
            <TrainingOfferLetterTemplate
              cert={viewingCert}
              certText={certText}
            />
          ) : viewingCert.type === "completion_letter" ? (
            <CompletionLetterTemplate cert={viewingCert} certText={certText} />
          ) : viewingCert.type === "internship" ? (
            <InternshipCertificateTemplate
              cert={viewingCert}
              certText={certText}
            />
          ) : (
            <TrainingCertificateTemplate
              cert={viewingCert}
              certText={certText}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="certificates-module">
      <div className="flex items-center gap-3 flex-wrap">
        <Award className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Certificates</h2>
      </div>

      {!courseComplete && (
        <Card
          className="border-orange-500/20"
          data-testid="course-incomplete-card"
        >
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-orange-400" />
              <p className="font-medium text-orange-400">Certificates Locked</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete 100% of your training course to unlock certificate
              generation. Current progress: {progressSummary?.completed ?? 0}/
              {progressSummary?.total ?? 0} modules.
            </p>
            <Progress
              value={progressSummary?.percentage ?? 0}
              className="h-2"
              data-testid="progress-certificates"
            />
          </CardContent>
        </Card>
      )}

      {courseComplete &&
        (canGenerateTraining ||
          canGenerateOfferLetter ||
          canGenerateInternship ||
          canGenerateCompletionLetter) && (
          <Card data-testid="generate-certificates-card">
            <CardHeader>
              <CardTitle className="text-base">Generate Certificates</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {canGenerateTraining && (
                <Button
                  onClick={() => generateMutation.mutate("training")}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-training"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Training Certificate
                </Button>
              )}
              {canGenerateOfferLetter && (
                <Button
                  onClick={() => generateMutation.mutate("offer_letter")}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-offer-letter"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Offer Letter
                </Button>
              )}
              {canGenerateInternship && (
                <Button
                  onClick={() => generateMutation.mutate("internship")}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-internship"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Certificate of Internship
                </Button>
              )}
              {canGenerateCompletionLetter && (
                <Button
                  onClick={() => generateMutation.mutate("completion_letter")}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-completion-letter"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Completion Letter
                </Button>
              )}
            </CardContent>
          </Card>
        )}

      {certificates.length === 0 ? (
        <Card data-testid="certificates-empty">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              No certificates yet
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Complete your training and internship milestones to earn
              certificates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <Card
              key={cert.id}
              className="hover:border-blue-500/30 transition-colors"
              data-testid={`card-certificate-${cert.id}`}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <CardTitle
                    className="text-base leading-snug"
                    data-testid={`text-cert-title-${cert.id}`}
                  >
                    {cert.title}
                  </CardTitle>
                  <Badge
                    variant={CERT_TYPE_BADGE_VARIANT[cert.type] || "default"}
                    className="text-xs"
                    data-testid={`badge-cert-type-${cert.id}`}
                  >
                    {CERT_TYPE_LABELS[cert.type] || cert.type}
                  </Badge>
                </div>
                <Award className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
              </CardHeader>
              <CardContent className="space-y-3">
                {cert.internName && (
                  <p
                    className="text-sm"
                    data-testid={`text-cert-name-${cert.id}`}
                  >
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{cert.internName}</span>
                  </p>
                )}
                {cert.certificateNumber && (
                  <p
                    className="text-sm"
                    data-testid={`text-cert-number-${cert.id}`}
                  >
                    <span className="text-muted-foreground">ID:</span>{" "}
                    <span className="font-mono text-xs">
                      {cert.certificateNumber}
                    </span>
                  </p>
                )}
                <p
                  className="text-sm text-muted-foreground"
                  data-testid={`text-cert-date-${cert.id}`}
                >
                  Issued:{" "}
                  {cert.issuedAt
                    ? new Date(cert.issuedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
                {cert.programStartDate && cert.programEndDate && (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid={`text-cert-duration-${cert.id}`}
                  >
                    Duration: {cert.programStartDate} — {cert.programEndDate}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setViewingCert(cert)}
                  data-testid={`button-view-${cert.id}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View & Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
