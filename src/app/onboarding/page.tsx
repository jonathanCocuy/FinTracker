'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PiggyBank, ArrowRight, Wallet, BarChart3, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useI18n } from "@/src/lib/i18n";
import { supabase } from "@/src/lib/supabase";

export default function OnboardingPage() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const steps = [
    {
      title: t("onboarding.steps.welcome.title"),
      description: t("onboarding.steps.welcome.description"),
      icon: <PiggyBank className="h-16 w-16 text-primary" />,
    },
    {
      title: t("onboarding.steps.accounts.title"),
      description: t("onboarding.steps.accounts.description"),
      icon: <Wallet className="h-16 w-16 text-primary" />,
    },
    {
      title: t("onboarding.steps.expenses.title"),
      description: t("onboarding.steps.expenses.description"),
      icon: <BarChart3 className="h-16 w-16 text-primary" />,
    },
    {
      title: t("onboarding.steps.security.title"),
      description: t("onboarding.steps.security.description"),
      icon: <ShieldCheck className="h-16 w-16 text-primary" />,
    }
  ];

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await supabase.auth.updateUser({ data: { onboarding_completed: true } });
      router.push("/dashboard");
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className="mb-8 p-6 rounded-3xl bg-primary/10 shadow-inner">
            {steps[currentStep].icon}
          </div>

          <motion.h1 
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="text-3xl font-bold tracking-tighter mb-4"
          >
            {steps[currentStep].title}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg mb-12"
          >
            {steps[currentStep].description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Indicadores de progreso (puntitos) */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, index) => (
          <div 
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
            )}
          />
        ))}
      </div>

      <Button 
        size="lg" 
        onClick={nextStep}
        className="w-full max-w-sm rounded-2xl py-8 text-lg font-bold gap-2 shadow-xl hover:scale-[1.02] transition-transform"
      >
        {currentStep === steps.length - 1 ? t("onboarding.startNow") : t("onboarding.next")}
        <ArrowRight size={20} />
      </Button>
    </div>
  );
}

