import { Award, BookOpen, Users, ArrowRight, CheckCircle } from "lucide-react";
import StarField from "@/components/StarField";
import selectionImg from "@assets/selection-3d-paths.png";
import benefitsImg from "@assets/benefits-3d-career.png";

const selectionOptions = [
  {
    title: "Option 1 — Complete Training Program",
    description:
      "Participants who complete the entire training program and submit required tasks can directly join the internship.",
    icon: BookOpen,
    gradient: "from-purple-500 to-blue-500",
  },
  {
    title: "Option 2 — Pass the Technical Test",
    description:
      "Experienced applicants may attempt a technical test. Those who pass can join the internship without completing the full training program.",
    icon: Award,
    gradient: "from-blue-500 to-cyan-500",
  },
];

const benefits = [
  "🎓 Certification with comprehensive training",
  "📚 Structured, easy-to-follow learning modules",
  "💼 Hands-on experience with real projects",
  "📜 Internship & work experience certificates",
  "🎨 Portfolio and resume building support",
  "🎁 Performance-based rewards",
  "🤝 Exposure to industry professionals",
];

const whoCanApply = [
  "Students interested in Web3 and blockchain",
  "Developers who want to transition into Web3",
  "Beginners interested in AI and decentralized technology",
  "Anyone passionate about learning modern technologies",
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0a1a 0%, #0d0b2e 25%, #150d3a 50%, #0d0b2e 75%, #0a0a1a 100%)",
        }}
      />
      <StarField />

      <div className="absolute top-40 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-60 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px]" />

      <div className="relative z-10 py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-2 rounded-full bg-white/[0.06] border border-purple-500/20 backdrop-blur-sm mb-6">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                How to Join
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold mb-5 text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Internship{" "}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Selection Process
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              There are two ways to join the internship program.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-24 items-center">
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {selectionOptions.map((option, index) => (
                <div
                  key={index}
                  className="group relative p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(20,15,50,0.8) 0%, rgba(12,10,35,0.9) 100%)",
                  }}
                  data-testid={`card-selection-option-${index}`}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-[0.08] transition-all duration-700`}
                  />
                  <div
                    className={`absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-15 rounded-full blur-3xl transition-all duration-700`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.gradient} p-[2px] mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    >
                      <div className="w-full h-full rounded-xl bg-[#0d0b2e]/90 flex items-center justify-center">
                        <option.icon className="w-7 h-7 text-white/80 group-hover:text-white transition-all duration-500" />
                      </div>
                    </div>
                    <h3
                      className="text-lg font-bold text-white mb-2"
                      style={{ fontFamily: "Space Grotesk, sans-serif" }}
                    >
                      {option.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="lg:col-span-2 hidden lg:block relative"
              style={{ perspective: "1000px" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-blue-500/15 rounded-2xl blur-3xl scale-90" />
              <div className="relative group">
                <div
                  className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl shadow-purple-500/10 transition-all duration-700 group-hover:shadow-purple-500/25"
                  style={{ transform: "rotateY(-4deg) rotateX(2deg)" }}
                >
                  <img
                    src={selectionImg}
                    alt="Selection Process"
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b2e]/50 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-10 mb-24 items-start">
            <div>
              <div className="inline-block px-4 py-2 rounded-full bg-white/[0.06] border border-green-500/20 backdrop-blur-sm mb-6">
                <span className="text-sm font-medium bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Why Join
                </span>
              </div>
              <h3
                className="text-3xl md:text-4xl font-bold mb-5 text-white"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Benefits of the{" "}
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Program
                </span>
              </h3>
              <p className="text-gray-400 mb-6 text-base">
                What you gain from the internship:
              </p>
              <ul className="space-y-3">
                {benefits.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md shadow-green-500/20">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden border border-white/10 p-10 mb-0"
            style={{
              background:
                "linear-gradient(145deg, rgba(20,15,50,0.7) 0%, rgba(12,10,35,0.8) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3 text-center lg:text-left">
                <div className="inline-block px-4 py-2 rounded-full bg-white/[0.06] border border-purple-500/20 backdrop-blur-sm mb-5">
                  <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Open to All
                  </span>
                </div>
                <h3
                  className="text-3xl md:text-4xl font-bold mb-6 text-white"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Who Can{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Apply?
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {whoCanApply.map((item, index) => (
                    <div
                      key={index}
                      className="group flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-0.5"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                      data-testid={`card-who-can-apply-${index}`}
                    >
                      <Users className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <span className="text-gray-300 group-hover:text-white transition-colors text-sm font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="lg:col-span-2 hidden lg:block relative"
                style={{ perspective: "1000px" }}
              >
                <div
                  className="rounded-2xl overflow-hidden border border-purple-500/15 shadow-xl shadow-purple-500/10 group"
                  style={{ transform: "rotateY(4deg) rotateX(2deg)" }}
                >
                  <img
                    src={benefitsImg}
                    alt="Career Growth"
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b2e]/40 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
