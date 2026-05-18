import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useShortcuts({ onAddNew, onCloseModals, searchInputId }) {
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onAddNew, onCloseModals, searchInputId]);
}
