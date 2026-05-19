import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import StarField from "@/components/StarField";
import hero3d from "@assets/hero-3d-blockchain.png";

interface HeroSectionProps {
  onApplyClick: () => void;
}

export default function HeroSection({ onApplyClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0a0a1a 0%, #0d0b2e 30%, #150d3a 50%, #0d0b2e 70%, #0a0a1a 100%)",
        }}
      />
      <StarField />

      <div
        className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-600/10 rounded-full blur-[100px] animate-pulse"
        style={{ animationDuration: "5s", animationDelay: "1s" }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in-up text-white"
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                animationDelay: "0.1s",
              }}
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                EtherAuthority
              </span>{" "}
              Internship Program
            </h1>

            <p
              className="text-lg text-gray-300 mb-4 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Start your journey in Blockchain, AI, Web3, React.js, and Node.js
              with our structured internship training program. Learn
              industry-ready skills, complete real tasks, and become a
              professional Web3 developer.
            </p>

            <p
              className="text-base text-gray-500 mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.25s" }}
            >
              Gain practical experience while building decentralized
              applications and working with modern web technologies.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Button
                size="lg"
                onClick={onApplyClick}
                className="group relative px-10 py-7 text-lg rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-0 overflow-hidden"
                data-testid="button-start-training"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center">
                  Start Training
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Button>
              <Button
                size="lg"
                onClick={onApplyClick}
                variant="outline"
                className="group relative px-10 py-7 text-lg rounded-2xl border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden text-white"
                data-testid="button-apply-internship"
              >
                <span className="relative z-10 flex items-center">
                  Apply for Internship
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Button>
            </div>

            <div
              className="flex items-center gap-6 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              {[
                { value: "4 Weeks", label: "Training" },
                { value: "1 Month", label: "Internship" },
                { value: "Remote", label: "Work Mode" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative hidden lg:block animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl scale-90" />

            <div className="relative group" style={{ perspective: "1200px" }}>
              <div
                className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-500/10 transition-all duration-700 group-hover:shadow-purple-500/30"
                style={{
                  transform: "rotateY(-5deg) rotateX(3deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                <img
                  src={hero3d}
                  alt="AI and Blockchain Technology"
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b2e]/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              <div
                className="absolute -bottom-4 -right-4 w-24 h-24 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 p-[2px] shadow-lg shadow-purple-500/30 animate-float motion-reduce:animate-none"
                style={{ transform: "translateZ(40px)" }}
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-xl bg-[#0d0b2e] flex items-center justify-center">
                  <span className="text-2xl">⛓️</span>
                </div>
              </div>
              <div
                className="absolute -top-3 -left-3 w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-[2px] shadow-lg shadow-cyan-500/30 animate-float motion-reduce:animate-none"
                style={{
                  animationDelay: "1.5s",
                  transform: "translateZ(30px)",
                }}
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-xl bg-[#0d0b2e] flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
              </div>
              <div
                className="absolute top-1/2 -right-6 w-16 h-16 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 p-[2px] shadow-lg shadow-pink-500/30 animate-float motion-reduce:animate-none"
                style={{ animationDelay: "3s", transform: "translateZ(50px)" }}
                aria-hidden="true"
              >
                <div className="w-full h-full rounded-lg bg-[#0d0b2e] flex items-center justify-center">
                  <span className="text-lg">💎</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
