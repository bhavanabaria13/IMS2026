
import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send, Loader2 } from "lucide-react";
import { SiTelegram, SiX, SiLinkedin,SiYoutube,SiGithub } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import contactImage from "@/assets/3.jpg";

export default function ContactUs() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-background to-blue-900/10 pointer-events-none" />
      <Header onApplyClick={() => setLocation('/career')} onAdminClick={() => setLocation('/admin/login')} onInternClick={() => setLocation('/intern/login')} onContactClick={() => setLocation('/contact')} onCareerClick={() => setLocation('/career')} />
      
      <main className="relative py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto" style={{ marginTop: "22px"}}>
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Get In Touch
            </h1>
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
              Have questions about our services or internship program? We'd love to hear from you.
            </p>
          </div>

      
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Send us a Message</h2>
              <Card className="border-white/10 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">First Name *</label>
                        <Input 
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="John" 
                          className="bg-background/50 border-white/10"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name *</label>
                        <Input 
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe" 
                          className="bg-background/50 border-white/10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <Input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com" 
                        className="bg-background/50 border-white/10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject *</label>
                      <Input 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="How can we help?" 
                        className="bg-background/50 border-white/10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message *</label>
                      <Textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Your message..." 
                        rows={6} 
                        className="bg-background/50 border-white/10"
                        required
                        minLength={10}
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">Follow Us</h2>
              <Card className="border-white/10 bg-gradient-to-br from-purple-500/5 to-blue-500/5 mb-8">
                <CardContent className="p-8">
                                 <div className="relative mb-4">
  <img
    src={contactImage}
    alt="Contact Us"
    className="w-full h-auto max-h-[380px] object-cover rounded-xl shadow-lg"
  />
</div>
                  <p className="text-foreground/70 mb-6">
                    Stay connected with us on social media for the latest updates, insights, and announcements about blockchain technology and our services.
                  </p>
                  <div className="flex gap-4">
                     <a
                href="https://t.me/etherauthority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiTelegram className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>

              <a
                href="https://twitter.com/Ether_Authority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiX className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>

              <a
                href="https://www.linkedin.com/company/etherauthority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiLinkedin className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>
                          
                          
                            <a
                href="https://www.youtube.com/channel/UCOW2MNIhdrUsE_etsh9UpIQ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                          <SiYoutube className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>
                          
                          
                            <a
                href="https://github.com/EtherAuthority"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-600 flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-white/10"
              >
                <SiGithub className="w-5 h-5 text-foreground/60 group-hover:text-white" />
              </a>
            
                  </div>
                </CardContent>
              </Card>

              
            </div>
          </div>
        </div>
      </main>

      <Footer 
        onCareerClick={() => setLocation('/')}
      />
    </div>
  );
}
