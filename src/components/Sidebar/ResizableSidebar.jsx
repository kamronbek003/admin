import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

// Kontekst yordamida yig'ilgan holatni boshqa komponentlarga ham uzatish mumkin
const SidebarContext = createContext();

export function ResizableSidebar({ children }) {
    // Kenglik va yig'ilgan holatni localStorage'dan o'qish yoki standart qiymat belgilash
    const [isCollapsed, setIsCollapsed] = useState(() => 
        JSON.parse(localStorage.getItem('sidebar-collapsed')) || false
    );
    const [width, setWidth] = useState(() => 
        parseInt(localStorage.getItem('sidebar-width'), 10) || 280
    );
    
    // Mobil qurilmalar uchun sidebar holati
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const sidebarRef = useRef(null);
    const isResizingRef = useRef(false);

    // Kenglikni o'zgartirish funksiyalari
    const startResizing = useCallback((e) => {
        e.preventDefault();
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        // Holat o'zgarganda saqlash
        if (width) {
            localStorage.setItem('sidebar-width', width);
        }
    }, [width]);

    const resize = useCallback((e) => {
        if (isResizingRef.current) {
            const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            // Minimal va maksimal kenglikni cheklash
            if (newWidth >= 220 && newWidth <= 400) {
                setWidth(newWidth);
            }
        }
    }, []);

    // Yig'ish/ochish holatini saqlash
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
        if (isCollapsed) {
            setWidth(80); // Yig'ilgandagi standart kenglik (ikonka + padding)
        } else {
            setWidth(parseInt(localStorage.getItem('sidebar-width'), 10) || 280);
        }
    }, [isCollapsed]);
    
    // Global event listener'larni qo'shish va olib tashlash
    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    const handleToggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed }}>
            {/* Mobil qurilmalar uchun qora fon */}
            {isMobileOpen && (
                 <div
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                ></div>
            )}
           
            <aside
                ref={sidebarRef}
                style={{ width: isCollapsed ? '80px' : `${width}px` }}
                className={`
                    fixed md:relative inset-y-0 left-0
                    flex flex-col h-screen bg-white dark:bg-slate-900 shadow-xl
                    ring-1 ring-slate-900/5 dark:ring-slate-100/5
                    transition-all duration-300 ease-in-out z-40
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                `}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className={`flex items-center gap-2 overflow-hidden transition-all ${isCollapsed ? 'w-0' : 'w-full'}`}>
                         <img src="images/londonLogo.png" className="h-10 w-10 rounded-lg" alt="Logo" />
                         <span className="font-bold text-lg whitespace-nowrap dark:text-white">Boshqaruv</span>
                    </div>
                    <button onClick={handleToggleCollapse} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hidden md:block">
                        {isCollapsed ? <ChevronRight className="dark:text-slate-300"/> : <ChevronLeft className="dark:text-slate-300"/>}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
                    <ul className="space-y-2">{children}</ul>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                        <img
                            src="https://i.pravatar.cc/150?u=admin"
                            alt="Admin"
                            className="w-10 h-10 rounded-full"
                        />
                        <div className={`
                            flex justify-between items-center
                            overflow-hidden transition-all ${isCollapsed ? 'w-0' : 'w-52 ml-3'}
                        `}>
                            <div className="leading-4">
                                <h4 className="font-semibold dark:text-white">Admin</h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400">admin@example.com</span>
                            </div>
                            <MoreVertical size={20} className="dark:text-slate-300"/>
                        </div>
                    </div>
                </div>

                {/* Hajmni o'zgartirish uchun tutqich */}
                {!isCollapsed && (
                    <div
                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-indigo-500/50 transition-colors duration-200 group"
                        onMouseDown={startResizing}
                    >
                        <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 group-hover:bg-transparent"></div>
                    </div>
                )}
            </aside>
             {/* Mobil uchun ochish tugmasi (Header'ga qo'yiladi) */}
             {/* <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2">MENU</button> */}
        </SidebarContext.Provider>
    );
}

// Menyu bandi uchun alohida komponent
export function NavItem({ icon, text, active, alert, onClick }) {
    const { isCollapsed } = useContext(SidebarContext);
    return (
        <li
            onClick={onClick}
            className={`
                relative flex items-center py-2.5 px-4 my-1
                font-medium rounded-md cursor-pointer
                transition-colors group
                ${
                    active
                        ? 'bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800 dark:from-indigo-800 dark:to-indigo-900 dark:text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }
            `}
        >
            {icon}
            <span className={`overflow-hidden transition-all ${isCollapsed ? 'w-0 ml-0' : 'w-52 ml-3'}`}>
                {text}
            </span>
            {alert && !isCollapsed && (
                <div className="absolute right-4 w-2 h-2 rounded bg-indigo-500"></div>
            )}

            {/* Yig'ilgan holatdagi tooltip */}
            {isCollapsed && (
                <div className="
                    absolute left-full rounded-md px-2 py-1 ml-6
                    bg-indigo-100 text-indigo-800 text-sm
                    invisible opacity-20 -translate-x-3 transition-all
                    group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                    dark:bg-indigo-900 dark:text-white whitespace-nowrap
                ">
                    {text}
                </div>
            )}
        </li>
    );
}