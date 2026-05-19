import {
  SiTelegram,
  SiX,
  SiLinkedin,
  SiYoutube,
  SiGithub,
} from "react-icons/si";
import logo from "@/assets/logo.png";

interface FooterProps {
  onCareerClick?: () => void;
  onContactClick?: () => void;
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export default function Footer({
  onCareerClick,
  onContactClick,
  onPrivacyClick,
  onTermsClick,
}: FooterProps = {}) {
  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-background to-background/80 backdrop-blur-xl overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <a href="/" aria-label="EtherAuthority Home">
              <img src={logo} alt="EtherAuthority Logo" className="w-48" />
            </a>

            <p className="text-sm text-foreground/60 leading-relaxed">
              210 BRTS Rd, Surat,
              <br />
              Gujarat, INDIA – 395001
              <br />
              <a
                href="mailto:contact@etherauthority.io"
                className="hover:text-purple-400 transition-colors"
              >
                contact@etherauthority.io
              </a>
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              <a
                href="https://t.me/etherauthority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiTelegram className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>

              <a
                href="https://twitter.com/Ether_Authority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiX className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>

              <a
                href="https://www.linkedin.com/company/etherauthority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiLinkedin className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>

              <a
                href="https://www.youtube.com/channel/UCOW2MNIhdrUsE_etsh9UpIQ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiYoutube className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>

              <a
                href="https://github.com/EtherAuthority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiGithub className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">
              Our Services
            </h4>
            <ul className="space-y-3 text-sm text-foreground/60">
              <li>
                <a
                  href="https://etherauthority.io/smart-contract-audit/"
                  target="_blank"
                >
                  Smart Contract Audit
                </a>
              </li>
              <li>
                <a
                  href="https://etherauthority.io/smart-contract-development/"
                  target="_blank"
                >
                  Smart Contract Development
                </a>
              </li>
              <li>
                <a
                  href="https://etherauthority.io/public-blockchain-development/"
                  target="_blank"
                >
                  Public Blockchain Development
                </a>
              </li>
              <li>
                <a href="https://etherauthority.io/kyc/" target="_blank">
                  KYC
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://etherauthority.io/privacy-policy/"
                  target="_blank"
                >
                  Privacy Policy
                </a>
              </li>

              <li>
                <a
                  href="https://etherauthority.io/terms-of-service/"
                  target="_blank"
                >
                  Terms of Service
                </a>
              </li>

              <li className="text-sm text-foreground/60">
                <a
                  href="https://etherauthority.io/disclaimers/"
                  target="_blank"
                >
                  Disclaimers
                </a>
              </li>
              <li className="text-sm text-foreground/60">
                <a
                  href="https://drive.google.com/drive/folders/1XGYG8TKR6pj-lnkA2KaiqhSeKv0Ms80p"
                  target="_blank"
                >
                  EA Media Kit
                </a>
              </li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-foreground">
              Important Links
            </h4>
            <ul className="space-y-3">
              <li className="text-sm text-foreground/60">
                <a href="https://etherauthority.io/portfolio/" target="_blank">
                  Portfolio
                </a>
              </li>
              <li className="text-sm text-foreground/60">
                <a href="https://etherauthority.io/blog/" target="_blank">
                  Blog
                </a>
              </li>
              <li className="text-sm text-foreground/60">
                <a
                  href="https://www.youtube.com/channel/UCOW2MNIhdrUsE_etsh9UpIQ"
                  target="_blank"
                >
                  Videos
                </a>
              </li>
              <li className="text-sm text-foreground/60">Report Scam</li>
              {onCareerClick && (
                <li>
                  <button
                    onClick={onCareerClick}
                    className="text-sm text-foreground/60 hover:text-purple-400 transition-colors text-left"
                  >
                    Careers
                  </button>
                </li>
              )}
              {onContactClick && (
                <li>
                  <button
                    onClick={onContactClick}
                    className="text-sm text-foreground/60 hover:text-purple-400 transition-colors text-left"
                  >
                    Contact Us
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div style={{ textalign: "center" }}>
            <p className="text-sm text-foreground/60">
              © 2018 onwards, EtherAuthority. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
