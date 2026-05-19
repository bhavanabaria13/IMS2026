import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutProgramSection from "@/components/AboutProgramSection";
import BenefitsSection from "@/components/BenefitsSection";
import RequirementsSection from "@/components/RequirementsSection";
import CategoriesSection from "@/components/CategoriesSection";
import ApplicationForm from "@/components/ApplicationForm";
import Footer from "@/components/Footer";
import SupportChatbot from "@/components/SupportChatbot";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [formOpen, setFormOpen] = useState(false);

  const handleApplyClick = () => setFormOpen(true);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-background to-blue-900/10 pointer-events-none" />
      <Header 
        onAdminClick={() => setLocation('/admin/login')}
        onInternClick={() => setLocation('/intern/login')}
        onApplyClick={() => setFormOpen(true)}
        onCareerClick={() => setLocation('/career')}
        onContactClick={() => setLocation('/contact')}
      />
      <main>
        <HeroSection onApplyClick={handleApplyClick} />
        <AboutProgramSection />
        <CategoriesSection />
        <BenefitsSection />
        <RequirementsSection />
      </main>
      <Footer 
        onCareerClick={() => setLocation('/career')}
        onContactClick={() => setLocation('/contact')}
      />
      <ApplicationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => console.log("Application submitted")}
      />
      <SupportChatbot />
    </div>
  );
}