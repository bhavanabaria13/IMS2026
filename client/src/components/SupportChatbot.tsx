import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, HelpCircle, FileText, KeyRound } from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const faq = [
  {
    q: ["internship", "apply", "join"],
    a: "You can apply directly from the 'Apply Now' button on the homepage. Fill in the application form and you'll receive login credentials via email.",
  },
  {
    q: ["certificate", "cert"],
    a: "Yes! You'll receive a Training Completion Certificate after finishing the course, and an Internship Certificate upon completing the internship.",
  },
  {
    q: ["duration", "how long", "time"],
    a: "The training program is 4 weeks, followed by a 1-month internship period.",
  },
  {
    q: ["contact", "email", "support"],
    a: "You can reach us at contact@etherauthority.io or use the Contact Us page on the website.",
  },
  {
    q: ["forgot", "password", "reset"],
    a: "Use the 'Forgot Password' option on the login page. A temporary password will be sent to your registered email.",
  },
  {
    q: ["closed", "account", "deactivat"],
    a: "For closed account inquiries, please contact support at contact@etherauthority.io with your registered email.",
  },
  {
    q: ["category", "web3", "ai", "marketing", "design", "business", "dao"],
    a: "We offer 5 categories: Web3+AI, Digital Marketing, Graphics Design, Business Development, and DAO. Choose the one that fits your interests!",
  },
  {
    q: ["wallet", "ethereum", "address"],
    a: "You'll need to submit your Ethereum wallet address during the internship phase. Make sure it's a valid 0x address.",
  },
  {
    q: ["project", "task"],
    a: "You'll work on real-world projects in your chosen category. Complete all project tasks to progress through the program.",
  },
  {
    q: ["offer letter", "offer"],
    a: "Your offer letter is generated automatically after completing training. You can download it from the Certificates page.",
  },
];

const hotTopics = [
  { text: "How to apply for internship?", icon: "rocket" },
  { text: "Do I get a certificate?", icon: "award" },
  { text: "What is the internship duration?", icon: "clock" },
  { text: "How to contact support?", icon: "mail" },
  { text: "Password reset help", icon: "key" },
];

const getBotReply = (input: string): string => {
  const text = input.toLowerCase();
  for (const item of faq) {
    if (item.q.some((keyword) => text.includes(keyword))) {
      return item.a;
    }
  }
  return "I'm not sure about that. Try asking about internships, certificates, categories, or contact information. You can also reach us at contact@etherauthority.io.";
};

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! Welcome to EtherAuthority. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botReply = getBotReply(input);
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
      setIsTyping(false);
    }, 600);
  };

  const handleQuickQuestion = (question: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setIsTyping(true);

    setTimeout(() => {
      const botReply = getBotReply(question);
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        data-testid="chatbot-toggle"
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${
          open
            ? "bg-slate-700 hover:bg-slate-600 rotate-0"
            : "bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
        }`}
        style={{
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 24px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.15)",
        }}
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {open && (
        <div
          className="fixed right-4 sm:right-6 bottom-[88px] z-[9999] flex flex-col overflow-hidden"
          style={{
            width: "min(360px, calc(100vw - 32px))",
            height: "min(520px, calc(100vh - 100px))",
            borderRadius: "16px",
            background: "linear-gradient(180deg, #0f0b1a 0%, #131025 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow:
              "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.08)",
          }}
          data-testid="chatbot-window"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #1e1145 0%, #0c1929 100%)",
              borderBottom: "1px solid rgba(139,92,246,0.15)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                boxShadow: "0 4px 12px rgba(139,92,246,0.4)",
              }}
            >
              <Bot className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-[13px] leading-tight">
                EA Support
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-green-400 text-[10px] font-medium">
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              data-testid="chatbot-close"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.3) transparent" }}>
            <div
              className="px-3 py-2"
              style={{
                borderBottom: "1px solid rgba(139,92,246,0.08)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                  Quick Questions
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {hotTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(topic.text)}
                    className="px-2.5 py-1 text-[11px] rounded-full transition-all duration-200 hover:scale-[1.03] text-left"
                    style={{
                      background: "rgba(139,92,246,0.1)",
                      border: "1px solid rgba(139,92,246,0.2)",
                      color: "#c4b5fd",
                    }}
                    data-testid={`quick-topic-${index}`}
                  >
                    {topic.text}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="px-3 py-2"
              style={{
                borderBottom: "1px solid rgba(139,92,246,0.08)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Self Service
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() =>
                    handleQuickQuestion("Closed account transaction data")
                  }
                  className="p-2 rounded-lg text-left transition-all duration-200 hover:scale-[1.02] group"
                  style={{
                    background: "rgba(30,27,75,0.5)",
                    border: "1px solid rgba(139,92,246,0.12)",
                  }}
                  data-testid="self-service-closed"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400 mb-1 group-hover:text-purple-300 transition-colors" />
                  <p className="text-[11px] font-semibold text-slate-200 leading-tight">
                    Closed Account
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Get account report
                  </p>
                </button>
                <button
                  onClick={() => handleQuickQuestion("Forgot account help")}
                  className="p-2 rounded-lg text-left transition-all duration-200 hover:scale-[1.02] group"
                  style={{
                    background: "rgba(30,27,75,0.5)",
                    border: "1px solid rgba(139,92,246,0.12)",
                  }}
                  data-testid="self-service-forgot"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-400 mb-1 group-hover:text-purple-300 transition-colors" />
                  <p className="text-[11px] font-semibold text-slate-200 leading-tight">
                    Forgot Account
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    Recover your access
                  </p>
                </button>
              </div>
            </div>

            <div className="px-3 py-2">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 flex items-end gap-1.5 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {msg.sender === "bot" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #a855f7, #6366f1)",
                      }}
                    >
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {msg.sender === "user" && (
                    <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                      <User className="w-3 h-3 text-slate-300" />
                    </div>
                  )}
                  <div
                    className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[75%]"
                    style={
                      msg.sender === "user"
                        ? {
                            background:
                              "linear-gradient(135deg, #7c3aed, #6366f1)",
                            color: "#ffffff",
                            borderBottomRightRadius: "6px",
                          }
                        : {
                            background: "rgba(30,27,75,0.6)",
                            border: "1px solid rgba(139,92,246,0.15)",
                            color: "#cbd5e1",
                            borderBottomLeftRadius: "6px",
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="mb-3 flex items-end gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    }}
                  >
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl flex gap-1"
                    style={{
                      background: "rgba(30,27,75,0.6)",
                      border: "1px solid rgba(139,92,246,0.15)",
                      borderBottomLeftRadius: "6px",
                    }}
                  >
                    <span
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div
            className="px-3 py-2 shrink-0"
            style={{
              borderTop: "1px solid rgba(139,92,246,0.15)",
              background: "rgba(15,11,26,0.95)",
            }}
          >
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                background: "rgba(30,27,75,0.5)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent outline-none text-[13px] text-slate-200 placeholder-slate-500"
                placeholder="Type your question..."
                data-testid="chatbot-input"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 disabled:opacity-30"
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, #a855f7, #6366f1)"
                    : "transparent",
                }}
                data-testid="chatbot-send"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-center text-[9px] text-slate-600 mt-1.5">
              Powered by EtherAuthority
            </p>
          </div>
        </div>
      )}
    </>
  );
}
