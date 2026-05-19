import catWebDev from "@assets/cat-web-dev.png";
import catBlockchain from "@assets/cat-blockchain.png";
import catAiAutomation from "@assets/cat-ai-automation.png";
import catDigitalMarketing from "@assets/cat-digital-marketing.png";
import catUiUxDesign from "@assets/cat-ui-ux-design.png";
import catBusinessDev from "@assets/cat-business-dev.png";
import StarField from "@/components/StarField";

const categories = [
  {
    title: "Web Development",
    description: "HTML, CSS, PHP, React",
    image: catWebDev,
  },
  {
    title: "Blockchain",
    description: "Smart Contracts, Solidity",
    image: catBlockchain,
  },
  {
    title: "AI & Automation",
    description: "ChatGPT, AI Tools",
    image: catAiAutomation,
  },
  {
    title: "Digital Marketing",
    description: "SEO, Ads, Growth",
    image: catDigitalMarketing,
  },
  {
    title: "UI/UX Design",
    description: "Figma, Design Systems",
    image: catUiUxDesign,
  },
  {
    title: "Business Development",
    description: "Sales, Lead Generation",
    image: catBusinessDev,
  },
];


function CategoryCard({ cat, index }: { cat: typeof categories[number]; index: number }) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden border border-purple-500/20 flex-shrink-0 w-[260px] transition-all duration-500 hover:border-purple-400/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
      style={{
        background:
          "linear-gradient(145deg, rgba(20,15,50,0.9) 0%, rgba(15,10,40,0.95) 100%)",
      }}
      data-testid={`card-category-${index}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative overflow-hidden h-40">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b2e] via-transparent to-transparent z-10" />
        <img
          src={cat.image}
          alt={cat.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          draggable={false}
        />
      </div>

      <div className="relative z-10 px-4 pb-4 pt-2 text-center">
        <h3 className="text-sm font-bold text-white mb-0.5 group-hover:text-purple-300 transition-colors duration-300">
          {cat.title}
        </h3>
        <p className="text-xs text-gray-400">
          {cat.description}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

export default function CategoriesSection() {
  const marqueeItems = [...categories, ...categories];

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0a1a 0%, #0d0b2e 30%, #150d3a 50%, #0d0b2e 70%, #0a0a1a 100%)",
        }}
      />
      <StarField />

      <div className="relative z-10">
        <div className="text-center mb-12 px-4">
          <p
            className="text-sm font-semibold tracking-[0.25em] uppercase text-purple-400 mb-3"
            data-testid="text-categories-label"
          >
            Explore Opportunities
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            data-testid="text-categories-title"
          >
            Internship Categories
          </h2>
          <p
            className="text-gray-400 max-w-2xl mx-auto text-base"
            data-testid="text-categories-description"
          >
            Choose from a wide range of categories to kickstart your career in
            technology and business
          </p>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-20 bg-gradient-to-r from-[#0d0b2e] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-20 bg-gradient-to-l from-[#0d0b2e] to-transparent pointer-events-none" />

          <div className="flex gap-5 animate-marquee hover:[animation-play-state:paused]">
            {marqueeItems.map((cat, index) => (
              <CategoryCard key={`a-${index}`} cat={cat} index={index % categories.length} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
          width: max-content;
        }
      `}</style>
    </section>
  );
}
