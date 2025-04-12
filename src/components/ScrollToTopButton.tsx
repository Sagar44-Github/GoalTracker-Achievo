import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export function ScrollToTopButton() {
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(true);

  // Handle scroll events
  const handleScroll = () => {
    // Show scroll-up button when scrolled down more than 300px
    setShowScrollUp(window.scrollY > 300);

    // Show scroll-down button when not at the bottom
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.scrollY + windowHeight;

    setShowScrollDown(scrollPosition < documentHeight - 100);
  };

  // Scroll handlers
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {showScrollUp && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 rounded-full size-10 p-0 shadow-lg z-50"
          variant="secondary"
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </Button>
      )}

      {showScrollDown && (
        <Button
          onClick={scrollToBottom}
          className="fixed bottom-6 right-4 rounded-full size-10 p-0 shadow-lg z-50"
          variant="secondary"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </Button>
      )}
    </>
  );
}
