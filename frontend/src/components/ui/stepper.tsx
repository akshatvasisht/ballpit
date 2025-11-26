/**
 * Stepper Component (Wireframe Style)
 * Progress indicator for multi-step flows
 */

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center relative">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium text-sm transition-all duration-300",
                    isCompleted &&
                      "bg-[var(--sage-green)] border-[var(--sage-green)] text-white",
                    isCurrent &&
                      "bg-[var(--electric-cyan)] border-[var(--electric-cyan)] text-white shadow-[0_0_20px_var(--cyan-glow)]",
                    isUpcoming && "bg-transparent border-[var(--border)] text-muted-foreground"
                  )}
                  initial={false}
                  animate={
                    isCurrent
                      ? {
                          scale: [1, 1.05, 1],
                          transition: { duration: 2, repeat: Infinity },
                        }
                      : { scale: 1 }
                  }
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </motion.div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      (isCompleted || isCurrent) && "text-foreground",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 px-4 relative" style={{ marginTop: "-28px" }}>
                  <div className="h-0.5 bg-[var(--border)] relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-[var(--sage-green)]"
                      initial={{ width: "0%" }}
                      animate={{
                        width: isCompleted ? "100%" : isCurrent ? "50%" : "0%",
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
