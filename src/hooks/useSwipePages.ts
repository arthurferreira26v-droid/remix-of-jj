import { useRef, useState, useCallback } from "react";

interface UseSwipePagesOptions {
  threshold?: number; // percentage of screen width to trigger snap (0-1)
}

export const useSwipePages = ({ threshold = 0.35 }: UseSwipePagesOptions = {}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const totalPages = 2;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const deltaX = e.touches[0].clientX - touchStart.current.x;
    const deltaY = e.touches[0].clientY - touchStart.current.y;

    // Determine direction on first significant move
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
      return;
    }

    if (!isHorizontalSwipe.current) return;

    e.preventDefault();

    // Clamp: don't go beyond first or last page
    const screenW = window.innerWidth;
    const baseOffset = -currentPage * screenW;
    const newTotal = baseOffset + deltaX;

    if (newTotal > 0) {
      // Rubber band on left edge
      setDragOffset(deltaX * 0.2);
    } else if (newTotal < -(totalPages - 1) * screenW) {
      // Rubber band on right edge
      const overflow = newTotal + (totalPages - 1) * screenW;
      setDragOffset(deltaX + overflow * 0.8);
    } else {
      setDragOffset(deltaX);
    }
  }, [currentPage, totalPages]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !isHorizontalSwipe.current) {
      setIsDragging(false);
      setDragOffset(0);
      touchStart.current = null;
      return;
    }

    const screenW = window.innerWidth;
    const velocity = touchStart.current
      ? Math.abs(dragOffset) / (Date.now() - touchStart.current.time)
      : 0;

    // Snap decision: threshold-based or velocity-based
    const progress = Math.abs(dragOffset) / screenW;
    const shouldAdvance = progress > threshold || velocity > 0.5;

    if (shouldAdvance) {
      if (dragOffset < 0 && currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      } else if (dragOffset > 0 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }

    setDragOffset(0);
    setIsDragging(false);
    touchStart.current = null;
    isHorizontalSwipe.current = null;
  }, [dragOffset, currentPage, totalPages, threshold]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(totalPages - 1, page)));
    setDragOffset(0);
  }, [totalPages]);

  const translateX = -currentPage * 100 + (dragOffset / window.innerWidth) * 100;

  return {
    currentPage,
    translateX,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    goToPage,
  };
};
