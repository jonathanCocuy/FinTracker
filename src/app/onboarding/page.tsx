'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { PiggyBank, ArrowRight, Wallet, BarChart3, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";

const STEPS = [
  {
    title: "¡Bienvenido a FinTracker!",
    description: "La herramienta definitiva para tomar el control total de tu dinero de forma sencilla.",
    icon: <PiggyBank className="h-16 w-16 text-primary" />,
  },
  {
    title: "Gestiona tus Cuentas",
    description: "Conecta Nequi, Bancolombia o tus ahorros en efectivo en un solo lugar.",
    icon: <Wallet className="h-16 w-16 text-primary" />,
  },
  {
    title: "Analiza tus Gastos",
    description: "Visualiza en qué se va tu dinero con gráficas limpias y detalladas.",
    icon: <BarChart3 className="h-16 w-16 text-primary" />,
  },
  {
    title: "Seguridad Total",
    description: "Tus datos están protegidos con tecnología de grado bancario y Supabase.",
    icon: <ShieldCheck className="h-16 w-16 text-primary" />,
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
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
            {STEPS[currentStep].icon}
          </div>

          <motion.h1 
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="text-3xl font-bold tracking-tighter mb-4"
          >
            {STEPS[currentStep].title}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg mb-12"
          >
            {STEPS[currentStep].description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Indicadores de progreso (puntitos) */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, index) => (
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
        {currentStep === STEPS.length - 1 ? "Empezar ahora" : "Siguiente"}
        <ArrowRight size={20} />
      </Button>
    </div>
  );
}

// Función auxiliar simple si no tienes la de utils
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}