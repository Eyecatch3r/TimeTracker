import React from 'react';
import type {LucideIcon} from 'lucide-react';

interface HoverButtonProps {
    text: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
    disabled?: boolean;
    className?: string;
    /** If true, hides text on small screens and only shows icon */
    compactOnMobile?: boolean;
}

const HoverButton: React.FC<HoverButtonProps> = ({
                                                     text,
                                                     onClick,
                                                     href,
                                                     icon: Icon,
                                                     disabled = false,
                                                     className = '',
                                                     compactOnMobile = false
                                                 }) => {
    // Base styles
    const baseStyles = `
        group relative inline-flex items-center justify-center gap-3
        border-2 border-blue-400/50 text-blue-400 font-semibold rounded-full
        overflow-hidden transition-all duration-300 ease-out
        hover:text-slate-900 hover:border-blue-400 hover:shadow-[0_0_0_4px_rgba(96,165,250,0.3)]
        active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        ${compactOnMobile ? 'p-2 sm:px-8 sm:py-2 aspect-square sm:aspect-auto' : 'px-6 py-2'}
        ${className}
    `;

    // Arrow SVG definition
    const ArrowIcon = ({ className }: { className: string }) => (
        <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
            <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
        </svg>
    );

    const content = (
        <>
            {/* Background Circle Animation */}
            <span className="absolute inset-0 w-full h-full bg-blue-400 scale-0 rounded-full group-hover:scale-[2.5] transition-transform duration-500 ease-out -z-10 origin-center" />

            {/* Left Arrow - HIDDEN on mobile if compact */}
            <span className={`absolute left-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${compactOnMobile ? 'hidden sm:block' : ''}`}>
                <ArrowIcon className="" />
            </span>

            {/* Main Content (Icon + Text) */}
            {/* logic: On mobile compact, we DO NOT translate x, keeping it centered. On desktop, we translate x to make room for arrow */}
            <div className={`flex items-center gap-2 transition-transform duration-300 ${compactOnMobile ? 'group-hover:translate-x-0 sm:group-hover:translate-x-3' : 'group-hover:translate-x-3'}`}>
                {Icon && <Icon size={18} className="shrink-0" />}

                <span className={`${compactOnMobile ? 'hidden sm:inline-block' : 'inline-block'} whitespace-nowrap`}>
                    {text}
                </span>
            </div>

            {/* Right Arrow - HIDDEN on mobile if compact */}
            <span className={`absolute right-4 opacity-100 translate-x-0 group-hover:opacity-0 group-hover:translate-x-4 transition-all duration-300 ${compactOnMobile ? 'hidden sm:block' : ''}`}>
               <ArrowIcon className="" />
            </span>
        </>
    );

    if (href) {
        return (
            <a href={href} className={baseStyles}>
                {content}
            </a>
        );
    }

    return (
        <button onClick={onClick} disabled={disabled} className={baseStyles}>
            {content}
        </button>
    );
};

export default HoverButton;