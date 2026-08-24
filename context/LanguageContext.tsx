'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type LanguageContextType = {
    language: string;
    setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: any;
    }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const saved = localStorage.getItem('cosmeon_lang') || 'en';
        setLanguage(saved);

        // Google Translate Widget Init
        const addScript = () => {
            if (document.getElementById('google-translate-script')) return;
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
        };

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
            }, 'google_translate_element');
        };

        addScript();
    }, []);

    useEffect(() => {
        // Force the Google Translate widget to update when state changes
        const setTranslateCookie = (lang: string) => {
            const cookieValue = `/en/${lang}`;
            document.cookie = `googtrans=${cookieValue}; path=/;`;
            document.cookie = `googtrans=${cookieValue}; domain=${window.location.hostname}; path=/;`;

            // For root domain as well
            const domainParts = window.location.hostname.split('.');
            if (domainParts.length > 2) {
                const rootDomain = domainParts.slice(-2).join('.');
                document.cookie = `googtrans=${cookieValue}; domain=${rootDomain}; path=/;`;
            }
        };

        if (language !== 'en') {
            setTranslateCookie(language);
            // Some versions of the widget need a reload to pick up the cookie if already loaded
            // But we'll try to trigger it via the DOM if possible, or just refresh
            // localStorage.setItem('cosmeon_lang', language);
            // window.location.reload();
        } else {
            // Clear translation
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
        }

        localStorage.setItem('cosmeon_lang', language);
        document.documentElement.lang = language;
    }, [language]);

    const updateLanguage = (lang: string) => {
        setLanguage(lang);
        // Using a small timeout to let the cookie set before reload
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
            <div id="google_translate_element" style={{ display: 'none' }} />
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
