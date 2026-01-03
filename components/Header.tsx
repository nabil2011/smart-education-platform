import React from 'react';

interface HeaderProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isDarkMode, toggleTheme, title }) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#102216]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 lg:px-8">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Search (Desktop) */}
          <div className="hidden md:flex relative group">
            <input 
              type="text" 
              placeholder="بحث..." 
              className="w-64 pl-4 pr-10 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <span className="absolute right-3 top-2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined filled-icon">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#102216]"></span>
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <button className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 p-1 pr-2 pl-1 rounded-full transition-all">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">أحمد عبدالله</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mt-1">طالب متميز</p>
            </div>
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP-21jzbdNa6NazqRW4tIFmDibvlK3NHLdeoFo3096ErA05KkUBgemQEv6N-fZdxNVUTcgoFHzyhTDkjdI-D-koTAzZNTedkhoTRADpi298ZdCHu7UrIW8DYhfjG9DDNqRJdQR4665ZfqnEu8VSdWa2X0ynKHW2vv3R9FcmGCox-i2xmR10WzZ0yiBo3SZec9jkHmcjhT3nf5Xfewtud2yqYF9PbWn5y-qutXYA5R_DmmJUIGp4hVzjz_pwi1FqU5fQzVWiUUf6T4" 
              alt="User" 
              className="size-9 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;