import { useEffect, useRef } from 'react';

/**
 * Hook to handle modal behavior:
 * 1. Locks body scroll when open
 * 2. Intercepts back button to close modal instead of navigating back
 */
export const useModalBehavior = (isOpen: boolean, onClose: () => void) => {
    const pushedStateRef = useRef(false);

    useEffect(() => {
        if (!isOpen) return;

        // 1. Scroll Lock
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        // 2. Back Button Interception
        // Push a state so that 'Back' pops this state instead of going to previous page
        if (!pushedStateRef.current) {
            window.history.pushState({ modalOpen: true }, '', window.location.href);
            pushedStateRef.current = true;
        }

        const handlePopState = (event: PopStateEvent) => {
            // Back button was pressed
            // We are no longer in the pushed state
            pushedStateRef.current = false;
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            // Cleanup: Unlock Scroll
            document.body.style.overflow = originalStyle;

            // Cleanup: Remove listener
            window.removeEventListener('popstate', handlePopState);

            // Cleanup: History
            // If we are closing but the state is still pushed (e.g. clicked X button),
            // we need to go back manually to remove our pushed state.
            if (pushedStateRef.current) {
                // Remove the 'modalOpen' state we pushed
                window.history.back();
                pushedStateRef.current = false;
            }
        };
    }, [isOpen, onClose]);
};
