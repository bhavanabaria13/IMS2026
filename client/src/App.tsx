import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Career from "@/pages/Career";
import ContactUs from "@/pages/ContactUs";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import InternLogin from "./components/intern/InternLogin";
import InternDashboard from "./components/intern/InternDashboard";
import DaoLogin from "./components/dao/DaoLogin";
import DaoDashboard from "./components/dao/DaoDashboard";
import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import { queryClient } from "@/lib/queryClient";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/career" component={Career} />
          <Route path="/contact" component={ContactUs} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsConditions} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/:rest*" component={AdminDashboard} />
          <Route path="/intern/login" component={InternLogin} />
          <Route path="/intern/:rest*" component={InternDashboard} />
          <Route path="/dao/login" component={DaoLogin} />
          <Route path="/dao/:rest*" component={DaoDashboard} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
