import { Badge } from "@/components/ui/badge";
import { Sparkles, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import StarField from "@/components/StarField";
import teamImg from "@assets/team-3d-collab.png";

const requirements = [
  "We are excited to announce that EtherAuthority is hiring Interns who are enthusiastic, motivated, and eager to learn.",
  "\n",
  "This internship offers an excellent opportunity to gain hands-on experience, work on real-world projects, and develop professional and ethical work practices under structured guidance.",

  "Who Can Apply",

  "✔️ Students or freshers passionate about learning",
  "✔️ Candidates who are hardworking, professional, and committed",
  "✔️ Individuals willing to dedicate time and effort to skill development",

  "Internship Details",

  "✔️ Duration: 1 Month",
  "✔️ Mode: Remote",
  "✔️ Training: Structured Internship Program",
  "✔️ Work Commitment: 20–25 hours per week",
  "✔️ Stipend: Interns will receive a stipend of 5,000 SCAI tokens (cryptocurrency). Additionally, they will be eligible for extra rewards based on their performance.",

  "Join us and take the first step toward building a strong professional career with EtherAuthority.",
];

const faqItems = [
  {
    question: "What is the duration of the internship?",
    answer:
      "The internship duration is 1 month. If the intern is willing to continue and performance is satisfactory, he can join DAO. More details in the website dashboard.",
  },
  {
    question: "Is this internship paid?",
    answer:
      "Yes. Interns will receive a stipend of 5,000 SCAI tokens (cryptocurrency). Additionally, interns will receive extra rewards based on their performance.",
  },
  {
    question: "Will I receive a certificate after completing the internship?",
    answer:
      "Yes. Interns who successfully complete the internship will receive a certificate of completion.",
  },
  {
    question: "Is this internship remote or on-site?",
    answer:
      "This internship is conducted remotely, allowing interns to work from anywhere.",
  },
  {
    question: "Will I work on real projects?",
    answer:
      "Yes. Interns may work on real company projects or open-source projects to gain practical experience.",
  },
  {
    question: "Will I get a full-time job after the internship?",
    answer:
      "The internship does not guarantee a full-time position. However, interns with outstanding performance may be considered for future opportunities.",
  },
  {
    question: "Who can apply for this internship?",
    answer:
      "Students, recent graduates, and individuals interested in gaining practical experience in the relevant field are welcome to apply.",
  },
  {
    question: "Can I do this internship along with my college or job?",
    answer:
      "Yes. Many internships are flexible or remote, allowing interns to manage them alongside their academic schedule.",
  },
];

export default function RequirementsSection() {
  return (
    <section id="requirements" className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0a1a 0%, #0d0b2e 25%, #150d3a 50%, #0d0b2e 75%, #0a0a1a 100%)",
        }}
      />
      <StarField />

      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-600/8 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/8 rounded-full blur-[100px]" />

      <div className="relative z-10 py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-24">
            <div>
              <div className="inline-block px-4 py-2 rounded-full bg-white/[0.06] border border-purple-500/20 backdrop-blur-sm mb-6">
                <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Requirements
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-5 text-white"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Join Our Internship Program 🚀
              </h2>
              <p className="text-base text-gray-400 mb-8">
                We welcome passionate individuals eager to learn, grow their
                skills, and advance their careers.
              </p>

              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li
                    key={index}
                    className="text-gray-300 text-sm leading-relaxed"
                  >
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="relative hidden lg:block"
              style={{ perspective: "1000px" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-blue-500/15 rounded-2xl blur-3xl scale-90" />

              <div className="relative group">
                <div
                  className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-500/10 transition-all duration-700 group-hover:shadow-purple-500/25"
                  style={{ transform: "rotateY(5deg) rotateX(2deg)" }}
                >
                  <img
                    src={teamImg}
                    alt="Join Our Team"
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b2e]/50 via-transparent to-transparent" />
                </div>

                <div
                  className="mt-4 p-5 rounded-xl border border-purple-500/15 backdrop-blur-sm transition-all duration-500 group-hover:border-purple-500/30"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(20,15,50,0.8) 0%, rgba(12,10,35,0.9) 100%)",
                  }}
                >
                  <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Join Our Team
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Be part of a dynamic team working on innovative blockchain
                    solutions that are shaping the future of Web3.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden border border-white/10 p-8 md:p-12"
            style={{
              background:
                "linear-gradient(145deg, rgba(20,15,50,0.6) 0%, rgba(12,10,35,0.7) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-purple-500/3" />

            <div className="relative z-10">
              <div className="text-center mb-12">
                <div className="inline-block px-4 py-2 rounded-full bg-white/[0.06] border border-blue-500/20 backdrop-blur-sm mb-5">
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                    Frequently Asked Questions
                  </span>
                </div>
                <h2
                  className="text-4xl md:text-5xl font-bold mb-5 text-white"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  data-testid="text-faq-title"
                >
                  Got{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Questions?
                  </span>
                </h2>
                <p
                  className="text-gray-400 max-w-2xl mx-auto"
                  data-testid="text-faq-description"
                >
                  Everything you need to know about the EtherAuthority
                  internship program.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {faqItems.map((item, index) => (
                    <div
                      key={index}
                      className={`${index === faqItems.length - 1 && faqItems.length % 2 !== 0 ? "md:col-span-2 md:max-w-[calc(50%-0.5rem)]" : ""}`}
                    >
                      <Accordion type="single" collapsible>
                        <AccordionItem
                          value={`faq-${index}`}
                          className="border-0"
                          data-testid={`faq-item-${index}`}
                        >
                          <div className="group relative rounded-xl overflow-hidden">
                            <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-purple-500/30 transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 to-blue-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                            <div
                              className="absolute inset-0"
                              style={{ background: "rgba(15,12,40,0.6)" }}
                            />

                            <div className="relative backdrop-blur-sm px-5">
                              <AccordionTrigger
                                className="text-left hover:no-underline text-[14px] font-semibold gap-3 text-gray-200"
                                data-testid={`button-faq-toggle-${index}`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all duration-300">
                                    {index + 1}
                                  </span>
                                  <span className="group-hover:text-white transition-colors duration-300">
                                    {item.question}
                                  </span>
                                </span>
                              </AccordionTrigger>
                              <AccordionContent
                                className="text-gray-400 text-sm leading-relaxed pl-10 pb-4"
                                data-testid={`faq-answer-${index}`}
                              >
                                {item.answer}
                              </AccordionContent>
                            </div>
                          </div>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
