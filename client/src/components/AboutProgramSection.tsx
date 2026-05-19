import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Blocks,
  BarChart3,
  Palette,
  Briefcase,
  Users,
  Loader2,
} from "lucide-react";
import StarField from "@/components/StarField";

interface CategoryWithTopics {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  courseTopics: { id: string; name: string; sortOrder: number }[];
}

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: typeof Blocks;
    gradient: string;
    iconGradient: string;
    iconColor: string;
  }
> = {
  "Web3+AI": {
    icon: Blocks,
    gradient: "from-purple-500 to-blue-500",
    iconGradient: "from-purple-600 to-blue-600",
    iconColor: "text-purple-300",
  },
  "Digital Marketing": {
    icon: BarChart3,
    gradient: "from-cyan-500 to-emerald-500",
    iconGradient: "from-teal-500 to-emerald-500",
    iconColor: "text-emerald-300",
  },
  "Graphics Design": {
    icon: Palette,
    gradient: "from-pink-500 to-orange-500",
    iconGradient: "from-pink-600 to-orange-600",
    iconColor: "text-pink-300",
  },
  "Business Development": {
    icon: Briefcase,
    gradient: "from-amber-500 to-red-500",
    iconGradient: "from-amber-600 to-red-600",
    iconColor: "text-amber-300",
  },
  DAO: {
    icon: Users,
    gradient: "from-indigo-500 to-violet-500",
    iconGradient: "from-indigo-600 to-violet-600",
    iconColor: "text-indigo-300",
  },
};

const DEFAULT_CONFIG = {
  icon: Blocks,
  gradient: "from-purple-500 to-blue-500",
  iconGradient: "from-purple-600 to-blue-600",
  iconColor: "text-purple-300",
};

export default function AboutProgramSection() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<CategoryWithTopics[]>({
    queryKey: ["/api/categories-with-topics"],
  });

  const categoriesWithTopics = categories.filter(
    (c) => c.courseTopics.length > 0,
  );

  if (activeTab === null && categoriesWithTopics.length > 0) {
    setActiveTab(categoriesWithTopics[0].id);
  }

  const activeCat =
    categoriesWithTopics.find((c) => c.id === activeTab) ||
    categoriesWithTopics[0];

  const getConfig = (name: string) => CATEGORY_CONFIG[name] || DEFAULT_CONFIG;

  if (isLoading) {
    return (
      <section id="programs" className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #0a0a1a 0%, #0d0b2e 25%, #150d3a 50%, #0d0b2e 75%, #0a0a1a 100%)",
          }}
        />
        <div className="relative z-10 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </section>
    );
  }

  if (categoriesWithTopics.length === 0) return null;

  return (
    <section id="programs" className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0a1a 0%, #0d0b2e 25%, #150d3a 50%, #0d0b2e 75%, #0a0a1a 100%)",
        }}
      />
      <StarField />

      <div className="absolute top-40 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-40 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px]" />

      <div className="relative z-10 py-20 md:py-28 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-5"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Training{" "}
              <span
                className={`bg-gradient-to-r ${activeCat ? getConfig(activeCat.name).gradient : "from-purple-500 to-blue-500"} bg-clip-text text-transparent`}
              >
                Courses
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base leading-relaxed">
              Join our comprehensive training courses to gain hands-on
              experience and skills in Web3+Blockchain technology and Digital
              Marketing, preparing you for a successful career in these
              innovative fields.
            </p>
          </div>

          <div
            className={`grid gap-6 max-w-6xl mx-auto mb-14 ${
              categoriesWithTopics.length === 1
                ? "grid-cols-1 max-w-xl"
                : categoriesWithTopics.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-5xl"
                  : categoriesWithTopics.length === 3
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {categoriesWithTopics.map((cat) => {
              const config = getConfig(cat.name);
              const IconComponent = config.icon;
              return (
                <div
                  key={cat.id}
                  className={`group relative rounded-2xl p-7 border cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                    activeTab === cat.id
                      ? "border-purple-500/40 shadow-lg shadow-purple-500/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(20,15,50,0.8) 0%, rgba(12,10,35,0.9) 100%)",
                  }}
                  data-testid={`card-course-${cat.id}`}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.iconGradient} p-[2px] mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    >
                      <div className="w-full h-full rounded-xl bg-[#0d0b2e]/90 flex items-center justify-center">
                        <IconComponent
                          className={`w-7 h-7 ${config.iconColor}`}
                        />
                      </div>
                    </div>

                    <h3
                      className="text-xl font-bold text-white mb-2"
                      style={{ fontFamily: "Space Grotesk, sans-serif" }}
                    >
                      {cat.name} Training Course
                    </h3>
                    {cat.description && (
                      <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                        {cat.description}
                      </p>
                    )}

                    <ul className="space-y-2.5 mb-6">
                      {cat.courseTopics.map((topic) => (
                        <li
                          key={topic.id}
                          className="flex items-center gap-2.5 text-sm text-gray-300"
                        >
                          <span
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient} flex-shrink-0`}
                          />
                          {topic.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <a
              className="inline-flex items-center justify-center px-10 py-4 text-base font-semibold text-white rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 no-underline border border-purple-400/20"
              data-testid="button-full-curriculum"
              href="https://docs.google.com/document/d/1jobiopM_7XFRgRx304_WYjsP6o03OnDWmhvxH4CTaTY/edit?usp=sharing"
              target="_blank"
            >
              View Full Curriculum
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
