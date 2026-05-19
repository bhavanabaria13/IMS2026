import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import {
  SiX,
  SiTelegram,
  SiYoutube,
  SiGithub,
  SiFacebook,
  SiLinkedin,
  SiDiscord,
} from "react-icons/si";

/* ------------------ TABS ------------------ */
const TABS = [
  { id: "ea", label: "EtherAuthority" },
  { id: "scai", label: "SecureChain AI" },
  { id: "yogesh", label: "Yogesh Padsala (Founder & CTO)" },
];

/* ------------------ SOCIAL DATA ------------------ */
const SOCIAL_DATA: any = {
  ea: [
    {
      name: "Twitter/X",
      url: "https://x.com/Ether_Authority",
      icon: SiX,
      color: "#1d9bf0",
    },
    {
      name: "Telegram",
      url: "https://t.me/EtherAuthority",
      icon: SiTelegram,
      color: "#26A5E4",
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com/channel/UCOW2MNIhdrUsE_etsh9UpIQ",
      icon: SiYoutube,
      color: "#FF0000",
    },
    {
      name: "GitHub",
      url: "https://github.com/EtherAuthority",
      icon: SiGithub,
      color: "#6e40c9",
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/EtherAuthority",
      icon: SiFacebook,
      color: "#1877F2",
    },
    {
      name: "LinkedIn",
      url: "https://in.linkedin.com/company/etherauthority",
      icon: SiLinkedin,
      color: "#0A66C2",
    },
  ],
  scai: [
    {
      name: "Twitter/X",
      url: "https://x.com/SecureChainAI",
      icon: SiX,
      color: "#1d9bf0",
    },
    {
      name: "Telegram",
      url: "https://t.me/SecureChainAI",
      icon: SiTelegram,
      color: "#26A5E4",
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com/@SecureChainAI",
      icon: SiYoutube,
      color: "#FF0000",
    },
    {
      name: "GitHub",
      url: "https://github.com/securechainai",
      icon: SiGithub,
      color: "#6e40c9",
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/SecureChainAI/",
      icon: SiFacebook,
      color: "#1877F2",
    },
    {
      name: "Discord",
      url: "https://discord.gg/jVUUtzRAvQ",
      icon: SiDiscord,
      color: "#5865F2",
    },
  ],
  yogesh: [
    {
      name: "Twitter/X",
      url: "https://x.com/yogeshpadsala",
      icon: SiX,
      color: "#1d9bf0",
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/yogeshpadsala/",
      icon: SiLinkedin,
      color: "#0A66C2",
    },
    {
      name: "YouTube",
      url: "https://www.youtube.com/@YogeshPadsalaWorld",
      icon: SiYoutube,
      color: "#FF0000",
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/winwithyogesh/",
      icon: SiFacebook,
      color: "#1877F2",
    },
  ],
};

export default function PremiumSocialUI() {
  const [activeTab, setActiveTab] = useState("ea");
  const [visited, setVisited] = useState<any>({});

  /* LOAD STORAGE */
  useEffect(() => {
    const saved = localStorage.getItem("visited_socials");
    if (saved) setVisited(JSON.parse(saved));
  }, []);

  /* MARK VISITED */
  const markVisited = (url: string) => {
    const updated = { ...visited, [url]: true };
    setVisited(updated);
    localStorage.setItem("visited_socials", JSON.stringify(updated));
  };

  const currentList = SOCIAL_DATA[activeTab] || [];
  const completed = currentList.filter((i: any) => visited[i.url]).length;
  const progress =
    currentList.length > 0 ? (completed / currentList.length) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* HEADER */}

      {/* TABS */}
      <div className="flex gap-2 bg-muted/30 p-2 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROFILE */}
      {activeTab === "yogesh" && (
        <div className="p-5 rounded-xl border border-white/10 bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
          <h2 className="text-white font-semibold text-lg">Yogesh Padsala</h2>
          <p className="text-sm text-gray-300">Founder & CTO</p>
        </div>
      )}

      {/* SOCIAL CARDS */}
      <div className="grid gap-4">
        {currentList.map((item: any) => {
          const Icon = item.icon;
          const isVisited = visited[item.url];

          return (
            <div
              key={item.url}
              className={`rounded-xl border border-white/10 p-5 backdrop-blur bg-white/5 transition hover:scale-[1.02] ${
                isVisited ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: `${item.color}20`,
                      border: `1px solid ${item.color}40`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>

                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      Follow & stay updated
                    </p>
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  onClick={() => {
                    window.open(item.url, "_blank");
                    markVisited(item.url);
                  }}
                  className="px-4 py-2 rounded-full text-white text-sm flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  Open <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
