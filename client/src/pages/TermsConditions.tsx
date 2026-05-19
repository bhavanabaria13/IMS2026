
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

export default function TermsConditions() {
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
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Terms & Conditions
            </h1>
            <p className="text-foreground/60">Last updated: December 26, 2024</p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">1. Agreement to Terms</h2>
              <p className="text-foreground/70 leading-relaxed">
                By accessing and using the EtherAuthority website and services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms and Conditions, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">2. Use License</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Permission is granted to temporarily access the materials (information or software) on EtherAuthority's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or public display</li>
                <li>Attempt to decompile or reverse engineer any software on EtherAuthority's website</li>
                <li>Remove any copyright or proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">3. Internship Program Terms</h2>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">3.1 Application Process</h3>
              <p className="text-foreground/70 leading-relaxed mb-4">
                By submitting an application through our internship portal, you certify that all information provided is accurate and complete. False or misleading information may result in disqualification from the program.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-blue-400">3.2 Selection and Acceptance</h3>
              <p className="text-foreground/70 leading-relaxed mb-4">
                EtherAuthority reserves the right to accept or reject any application at our sole discretion. Selection for an internship does not guarantee employment.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-blue-400">3.3 Intern Responsibilities</h3>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Interns are expected to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
                <li>Complete assigned tasks in a timely and professional manner</li>
                <li>Maintain confidentiality of proprietary information</li>
                <li>Adhere to company policies and guidelines</li>
                <li>Submit regular progress reports as required</li>
                <li>Maintain professional conduct at all times</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">4. Intellectual Property</h2>
              <p className="text-foreground/70 leading-relaxed">
                All work product, inventions, and intellectual property created during your internship or use of our services become the exclusive property of EtherAuthority. You agree to assign all rights, title, and interest in such work to EtherAuthority.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">5. Confidentiality</h2>
              <p className="text-foreground/70 leading-relaxed">
                You agree to maintain the confidentiality of all proprietary and confidential information disclosed to you during your internship or use of our services. This obligation continues even after the termination of your internship or relationship with EtherAuthority.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">6. Disclaimer</h2>
              <p className="text-foreground/70 leading-relaxed">
                The materials on EtherAuthority's website are provided on an 'as is' basis. EtherAuthority makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">7. Limitations</h2>
              <p className="text-foreground/70 leading-relaxed">
                In no event shall EtherAuthority or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on EtherAuthority's website.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">8. Termination</h2>
              <p className="text-foreground/70 leading-relaxed">
                EtherAuthority may terminate your internship or access to services at any time, with or without cause, with or without notice. Upon termination, you must immediately cease all use of our services and return any company property.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">9. Governing Law</h2>
              <p className="text-foreground/70 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with applicable laws, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">10. Changes to Terms</h2>
              <p className="text-foreground/70 leading-relaxed">
                EtherAuthority reserves the right to revise these terms and conditions at any time. By using this website and our services, you are agreeing to be bound by the current version of these Terms and Conditions.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-purple-400">11. Contact Information</h2>
              <p className="text-foreground/70 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <p className="text-purple-400 mt-4">
                Email: legal@etherauthority.io
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
