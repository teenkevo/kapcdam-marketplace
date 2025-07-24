import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShieldCheck } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Add keyframes for the animated dashed line
const animatedLineStyle: React.CSSProperties = {
  width: 32,
  height: 2,
  margin: "0 0.5rem",
  background:
    "repeating-linear-gradient(90deg, #a3a3a3 0 6px, transparent 6px 12px)",
  backgroundSize: "12px 2px",
  animation: "move-dash 0.7s linear infinite",
};

// Add the keyframes to the document (only once)
if (
  typeof window !== "undefined" &&
  !document.getElementById("move-dash-keyframes")
) {
  const style = document.createElement("style");
  style.id = "move-dash-keyframes";
  style.innerHTML = `@keyframes move-dash { 0% { background-position-x: 0; } 100% { background-position-x: 12px; } }`;
  document.head.appendChild(style);
}

export default function RedirectToPayDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [showSecureMsg, setShowSecureMsg] = useState(false);

  useEffect(() => {
    if (open) {
      setShowSecureMsg(false);
      const timer = setTimeout(() => setShowSecureMsg(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div className="flex items-center justify-center bg-gray-50">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-xs border-0 bg-white p-6 shadow-lg"
          hideClose
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle asChild>
            <VisuallyHidden>Redirecting</VisuallyHidden>
          </DialogTitle>
          <div className="flex flex-col items-center space-y-3 text-center">
            {/* Icon Row */}
            <div className="flex items-center justify-center min-h-[32px]">
              <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
              <AnimatePresence>
                {showSecureMsg && (
                  <>
                    {/* Animated dashed line */}
                    <motion.span
                      key="dashed-line"
                      style={animatedLineStyle}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 32 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Secure icon */}
                    <motion.span
                      key="secure"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    </motion.span>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div>
              <AnimatePresence mode="wait" initial={false}>
                {!showSecureMsg ? (
                  <motion.p
                    key="redirecting"
                    className="text-sm font-medium text-gray-900"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    Redirecting, please wait
                  </motion.p>
                ) : (
                  <motion.p
                    key="secure"
                    className="text-sm font-medium text-gray-900"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    Taking you to a secure payment page.
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="mt-1 text-xs text-gray-500">
                {"Don't refresh your browser"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
