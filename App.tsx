import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { PageView, UserRole } from './types';

// Page Imports
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Quiz from './pages/Quiz';
import AIContentGen from './pages/AIContentGen';
import Landing from './pages/Landing';
import Gamification from './pages/Gamification';
import Pronunciation from './pages/Pronunciation';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AiTutor from './pages/AiTutor';
import Assignments from './pages/Assignments';
import ContentLibrary from './pages/ContentLibrary';
import StudentTracking from './pages/StudentTracking';
import RecoveryPlans from './pages/RecoveryPlans';
import EnhancementPlans from './pages/EnhancementPlans';
import DiagnosticTests from './pages/DiagnosticTests';
import Achievements from './pages/Achievements';
import Resources from './pages/Resources';
import SchoolsManagement from './pages/SchoolsManagement';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(PageView.LANDING);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Theme Toggle Logic
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Login
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsLoggedIn(true);
    
    // Navigate to appropriate dashboard based on role
    switch (role) {
      case UserRole.STUDENT:
        setCurrentView(PageView.DASHBOARD_STUDENT);
        break;
      case UserRole.TEACHER:
        setCurrentView(PageView.DASHBOARD_TEACHER);
        break;
      case UserRole.ADMIN:
        setCurrentView(PageView.DASHBOARD_ADMIN);
        break;
      default:
        setCurrentView(PageView.DASHBOARD_STUDENT);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView(PageView.LOGIN);
    setIsSidebarOpen(false);
  };

  // View Routing Logic
  const renderContent = () => {
    switch (currentView) {
      case PageView.DASHBOARD_STUDENT:
        return <StudentDashboard />;
      case PageView.DASHBOARD_TEACHER:
        return <TeacherDashboard />;
      case PageView.DASHBOARD_ADMIN:
        return <AdminDashboard />;
      case PageView.QUIZ:
        return <Quiz />;
      case PageView.AI_CONTENT:
        return <AIContentGen />;
      case PageView.AI_TUTOR:
        return <AiTutor />;
      case PageView.GAMIFICATION:
        return <Gamification />;
      case PageView.PRONUNCIATION:
        return <Pronunciation />;
      case PageView.ANALYTICS:
        return <Analytics />;
      case PageView.SETTINGS:
        return <Settings />;
      case PageView.ASSIGNMENTS:
        return <Assignments />;
      case PageView.CONTENT_LIBRARY:
        return <ContentLibrary />;
      case PageView.STUDENT_TRACKING:
        return <StudentTracking />;
      case PageView.RECOVERY_PLANS:
        return <RecoveryPlans />;
      case PageView.ENHANCEMENT_PLANS:
        return <EnhancementPlans />;
      case PageView.DIAGNOSTIC_TESTS:
        return <DiagnosticTests />;
      case PageView.ACHIEVEMENTS:
        return <Achievements />;
      case PageView.RESOURCES:
        return <Resources />;
      case PageView.SCHOOLS_MANAGEMENT:
        return <SchoolsManagement />;
      default:
        return userRole === UserRole.TEACHER ? <TeacherDashboard /> : 
               userRole === UserRole.ADMIN ? <AdminDashboard /> : 
               <StudentDashboard />;
    }
  };

  // If Landing Page, render full screen without layout
  if (currentView === PageView.LANDING) {
    return (
      <>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-fade-in { animation: fadeIn 0.5s ease-out; }
          .animate-slide-up { animation: slideUp 0.8s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <Landing onStart={() => setCurrentView(PageView.LOGIN)} />
      </>
    );
  }

  // If Login Page, render full screen without layout
  if (currentView === PageView.LOGIN) {
    return (
      <>
        <style>{`
          .animate-fade-in { animation: fadeIn 0.5s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark font-body text-slate-900 dark:text-slate-100">
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        .animate-slide-up { animation: slideUp 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col lg:mr-64 transition-all duration-300">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          title={
             currentView === PageView.DASHBOARD_STUDENT ? 'لوحة الطالب' : 
             currentView === PageView.DASHBOARD_TEACHER ? 'لوحة المعلم' :
             currentView === PageView.DASHBOARD_ADMIN ? 'لوحة الإدارة' :
             currentView === PageView.AI_CONTENT ? 'منشئ المحتوى الذكي' :
             currentView === PageView.AI_TUTOR ? 'المعلم الذكي' :
             currentView === PageView.GAMIFICATION ? 'الجوائز والشارات' :
             currentView === PageView.PRONUNCIATION ? 'تقييم النطق' :
             currentView === PageView.ANALYTICS ? 'التحليلات' :
             currentView === PageView.ASSIGNMENTS ? 'الواجبات' :
             currentView === PageView.CONTENT_LIBRARY ? 'مكتبة المحتوى' :
             currentView === PageView.STUDENT_TRACKING ? 'تتبع الطلاب' :
             currentView === PageView.RECOVERY_PLANS ? 'خطط التعويض' :
             currentView === PageView.ENHANCEMENT_PLANS ? 'خطط التعزيز' :
             currentView === PageView.DIAGNOSTIC_TESTS ? 'الاختبارات التشخيصية' :
             currentView === PageView.ACHIEVEMENTS ? 'الإنجازات' :
             currentView === PageView.RESOURCES ? 'المصادر التعليمية' :
             currentView === PageView.SCHOOLS_MANAGEMENT ? 'إدارة المدارس' :
             'الداعم التعليمي'
          }
        />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;