
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-background to-blue-900/10 pointer-events-none" />
      <Header onApplyClick={() => setLocation('/career')} onAdminClick={() => setLocation('/admin/login')} onInternClick={() => setLocation('/intern/login')} onContactClick={() => setLocation('/contact')} onCareerClick={() => setLocation('/career')} />
      
      <main className="relative py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Privacy Policy
            </h1>
            <p className="text-foreground/60">Last updated: December 26, 2024</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">1. Introduction</h2>
              <p className="text-foreground/70 leading-relaxed">
                EtherAuthority ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services, including our internship portal.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">2.1 Personal Information</h3>
              <p className="text-foreground/70 leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
                <li>Apply for an internship position</li>
                <li>Register for our services</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact us through our website</li>
              </ul>
              <p className="text-foreground/70 leading-relaxed mt-4">
                This information may include your name, email address, phone number, resume/CV, educational background, work experience, and other relevant professional information.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-blue-400">2.2 Automatically Collected Information</h3>
              <p className="text-foreground/70 leading-relaxed">
                When you visit our website, we may automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies installed on your device.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">3. How We Use Your Information</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
                <li>Process and evaluate internship applications</li>
                <li>Communicate with you about your application or our services</li>
                <li>Improve our website and services</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Comply with legal obligations</li>
                <li>Detect and prevent fraud or security issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">4. Data Security</h2>
              <p className="text-foreground/70 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">5. Data Retention</h2>
              <p className="text-foreground/70 leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">6. Your Rights</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
                <li>Access to your personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Restriction of processing</li>
                <li>Data portability</li>
                <li>Objection to processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">7. Cookies</h2>
              <p className="text-foreground/70 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">8. Third-Party Services</h2>
              <p className="text-foreground/70 leading-relaxed">
                We may employ third-party companies and individuals to facilitate our services, provide services on our behalf, or assist us in analyzing how our services are used. These third parties have access to your personal information only to perform these tasks on our behalf.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">9. Changes to This Privacy Policy</h2>
              <p className="text-foreground/70 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">10. Contact Us</h2>
              <p className="text-foreground/70 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-purple-400 mt-4">
                Email: privacy@etherauthority.io
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
