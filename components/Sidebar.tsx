import React from 'react';
import { PageView, UserRole } from '../types';

interface SidebarProps {
  currentView: PageView;
  onChangeView: (view: PageView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole?: UserRole;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, setIsOpen, userRole = UserRole.STUDENT, onLogout }) => {
  const getMenuItems = () => {
    const commonItems = [
      { label: 'الإعدادات', icon: 'settings', view: PageView.SETTINGS },
    ];

    if (userRole === UserRole.STUDENT) {
      return [
        { label: 'لوحة الطالب', icon: 'school', view: PageView.DASHBOARD_STUDENT },
        { label: 'المعلم الذكي', icon: 'smart_toy', view: PageView.AI_TUTOR },
        { label: 'الاختبارات', icon: 'quiz', view: PageView.QUIZ },
        { label: 'تقييم النطق', icon: 'mic', view: PageView.PRONUNCIATION },
        { label: 'الواجبات', icon: 'assignment', view: PageView.ASSIGNMENTS },
        { label: 'الجوائز والشارات', icon: 'emoji_events', view: PageView.GAMIFICATION },
        { label: 'المكتبة', icon: 'library_books', view: PageView.CONTENT_LIBRARY },
        { label: 'الإنجازات', icon: 'star', view: PageView.ACHIEVEMENTS },
        ...commonItems
      ];
    }

    if (userRole === UserRole.TEACHER) {
      return [
        { label: 'لوحة المعلم', icon: 'cast_for_education', view: PageView.DASHBOARD_TEACHER },
        { label: 'منشئ المحتوى الذكي', icon: 'auto_awesome', view: PageView.AI_CONTENT },
        { label: 'التحليلات', icon: 'analytics', view: PageView.ANALYTICS },
        { label: 'تتبع الطلاب', icon: 'person_search', view: PageView.STUDENT_TRACKING },
        { label: 'خطط التعويض', icon: 'healing', view: PageView.RECOVERY_PLANS },
        { label: 'خطط التعزيز', icon: 'trending_up', view: PageView.ENHANCEMENT_PLANS },
        { label: 'الاختبارات التشخيصية', icon: 'medical_services', view: PageView.DIAGNOSTIC_TESTS },
        { label: 'الواجبات', icon: 'assignment', view: PageView.ASSIGNMENTS },
        { label: 'المصادر التعليمية', icon: 'folder_shared', view: PageView.RESOURCES },
        { label: 'إنجازات الطلاب', icon: 'star', view: PageView.ACHIEVEMENTS },
        ...commonItems
      ];
    }

    if (userRole === UserRole.ADMIN) {
      return [
        { label: 'لوحة الإدارة', icon: 'admin_panel_settings', view: PageView.DASHBOARD_ADMIN },
        { label: 'إدارة المدارس', icon: 'domain', view: PageView.SCHOOLS_MANAGEMENT },
        { label: 'التحليلات الشاملة', icon: 'analytics', view: PageView.ANALYTICS },
        { label: 'تتبع الطلاب', icon: 'person_search', view: PageView.STUDENT_TRACKING },
        { label: 'المصادر التعليمية', icon: 'folder_shared', view: PageView.RESOURCES },
        { label: 'منشئ المحتوى الذكي', icon: 'auto_awesome', view: PageView.AI_CONTENT },
        ...commonItems
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  const getRoleTitle = () => {
    switch (userRole) {
      case UserRole.STUDENT:
        return 'الطالب';
      case UserRole.TEACHER:
        return 'المعلم';
      case UserRole.ADMIN:
        return 'الإدارة';
      default:
        return 'المستخدم';
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 right-0 h-full bg-white dark:bg-[#102216] border-l border-slate-200 dark:border-slate-800 z-30 transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600">
              <span className="material-symbols-outlined filled-icon">school</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">الداعم التعليمي</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleTitle()}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-70px)] scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                onChangeView(item.view);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${currentView === item.view 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400'}
              `}
            >
              <span className={`material-symbols-outlined transition-transform duration-300 ${currentView === item.view ? 'filled-icon scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {currentView === item.view && (
                <span className="mr-auto size-1.5 rounded-full bg-white/50" />
              )}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onLogout && onLogout()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-medium text-sm">تسجيل الخروج</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;