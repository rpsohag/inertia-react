import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';

createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });
        return pages[`./Pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                <App {...props} />
            </ThemeProvider>
        );
    },
});