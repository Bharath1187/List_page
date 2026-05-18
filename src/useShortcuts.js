import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useShortcuts({ onAddNew, onCloseModals, searchInputId, onPrint, onScan }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input/textarea (except for Escape)
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (onCloseModals) onCloseModals();
        return;
      }

      // Alt + N: Add New Product
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (onAddNew) onAddNew();
      }

      // Alt + C: Open Scanner directly (if supported by component)
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (onScan) onScan();
      }

      // Alt + P: Print (if supported by component)
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (onPrint) onPrint();
      }

      // Ctrl + /: Focus Search
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (searchInputId) {
          const searchInput = document.getElementById(searchInputId);
          if (searchInput) {
            searchInput.focus();
          }
        }
      }

      if (!isInput) {
        // Alt + D: Navigate to Dashboard
        if (e.altKey && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          navigate('/admin-dashboard');
        }

        // Alt + I: Navigate to Inventory List
        if (e.altKey && e.key.toLowerCase() === 'i') {
          e.preventDefault();
          navigate('/inventory');
        }

        // Alt + R: Navigate to Summary Report
        if (e.altKey && e.key.toLowerCase() === 'r') {
          e.preventDefault();
          navigate('/summary-report');
        }

        // Alt + B or Backspace: Navigate to Previous Page
        if ((e.altKey && e.key.toLowerCase() === 'b') || e.key === 'Backspace') {
          e.preventDefault();
          navigate(-1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onAddNew, onCloseModals, searchInputId, onPrint, onScan]);
}
