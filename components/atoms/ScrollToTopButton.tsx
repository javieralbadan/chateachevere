'use client';
import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.pageYOffset > 300);

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-10 right-6 bg-primary-color text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-opacity-90 z-50"
      aria-label="Scroll to top"
    >
      <FiArrowUp size={24} />
    </button>
  );
};
