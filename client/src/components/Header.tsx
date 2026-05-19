import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield } from "lucide-react";

import logo from "@/assets/logo.png";
import favicon from "@/assets/favicon.png";

interface HeaderProps {
  onApplyClick: () => void;
  onInternClick?: () => void;
  onCareerClick?: () => void;
  onContactClick?: () => void;
}

export default function Header({ onApplyClick, onInternClick, onCareerClick, onContactClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'backdrop-blur-xl bg-background/80 border-b border-white/10 shadow-lg' 
        : 'backdrop-blur-md bg-background/60 border-b border-white/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 animate-fade-in-up">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <a
  href="/"
  className="flex items-center gap-3 cursor-pointer"
  aria-label="Go to homepage"
>
  <img
    src={logo}
    alt="EtherAuthority Logo"
    className="w-10 h-10 object-contain" style={{ width: "100%"}}
  />
</a>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <a href="#programs" className="text-sm font-medium tracking-wide hover:text-purple-400 transition-all duration-300 relative group py-1">
              Programs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300 ease-out" />
            </a>
            <a href="#requirements" className="text-sm font-medium tracking-wide hover:text-purple-400 transition-all duration-300 relative group py-1">
              Requirements
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300 ease-out" />
            </a>
            <button onClick={onCareerClick} className="text-sm font-medium tracking-wide hover:text-purple-400 transition-all duration-300 relative group py-1">
              Career
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300 ease-out" />
            </button>
            <button onClick={onContactClick} className="text-sm font-medium tracking-wide hover:text-purple-400 transition-all duration-300 relative group py-1">
              Contact Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300 ease-out" />
            </button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onInternClick} 
              className="relative overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 group"
            >
              <span className="relative z-10">Intern Portal</span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
           
            <Button 
              onClick={onApplyClick} 
              className="relative px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 group overflow-hidden"
            >
              <span className="relative z-10">Apply Now</span>
              <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-in-up">
            <nav className="flex flex-col gap-4">
              <a
                href="#programs"
                className="text-sm font-medium text-muted-foreground hover:text-purple-400 transition-colors"
              >
                Programs
              </a>
              <a
                href="#requirements"
                className="text-sm font-medium text-muted-foreground hover:text-purple-400 transition-colors"
              >
                Requirements
              </a>
              <button onClick={onCareerClick} className="text-sm font-medium text-muted-foreground hover:text-purple-400 transition-colors text-left w-full">
                Career
              </button>
              <button onClick={onContactClick} className="text-sm font-medium text-muted-foreground hover:text-purple-400 transition-colors text-left w-full">
                Contact Us
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onInternClick}
                className="w-fit hover:bg-white/10"
              >
                Intern Portal
              </Button>
             
              <Button
                onClick={onApplyClick}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30"
              >
                Apply Now
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
