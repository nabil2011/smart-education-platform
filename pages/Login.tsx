import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  return (
    <div className="min-h-screen flex bg-surface-light dark:bg-surface-dark font-body">
      {/* Left Side - Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden items-center justify-center p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="size-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/30 shadow-xl">
            <span className="material-symbols-outlined text-5xl">school</span>
          </div>
          <h1 className="text-4xl font-black mb-6 font-display">مرحباً بك في مستقبل التعليم</h1>
          <p className="text-primary-100 text-lg leading-relaxed mb-8">
            منصة متكاملة تجمع بين قوة الذكاء الاصطناعي وسهولة الاستخدام لتوفير تجربة تعليمية لا مثيل لها.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               <div className="flex items-center gap-3 mb-2">
                 <span className="material-symbols-outlined text-yellow-300">auto_awesome</span>
                 <h3 className="font-bold">مساعد ذكي</h3>
               </div>
               <p className="text-xs text-primary-100 opacity-80">شرح فوري وحل للمسائل المعقدة</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
               <div className="flex items-center gap-3 mb-2">
                 <span className="material-symbols-outlined text-blue-300">analytics</span>
                 <h3 className="font-bold">تحليلات دقيقة</h3>
               </div>
               <p className="text-xs text-primary-100 opacity-80">تابع تقدمك وتحسن مستواك</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 animate-fade-in">
        <div className="max-w-md w-full">
          <div className="text-center mb-10 lg:hidden">
            <div className="size-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-primary-500/30">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">الداعم التعليمي</h2>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              {isLogin ? 'أهلاً بعودتك! الرجاء إدخال بياناتك للمتابعة.' : 'انضم إلينا وابدأ رحلة التعلم الذكي.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الاسم الأول</label>
                    <input type="text" className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="أحمد" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">العائلة</label>
                    <input type="text" className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="عبدالله" />
                  </div>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع المستخدم</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: UserRole.STUDENT, label: 'طالب', icon: 'school' },
                    { role: UserRole.TEACHER, label: 'معلم', icon: 'cast_for_education' },
                    { role: UserRole.ADMIN, label: 'إداري', icon: 'admin_panel_settings' }
                  ].map(({ role, label, icon }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        selectedRole === role
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{icon}</span>
                      <span className="text-xs font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <input 
                    type="email" 
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 pl-10 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                    placeholder="name@school.edu" 
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[20px]">mail</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input 
                    type="password" 
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 pl-10 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                    placeholder="••••••••" 
                  />
                  <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[20px]">lock</span>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary-500 focus:ring-primary-500 border-gray-300" />
                    <span className="text-slate-600 dark:text-slate-400">تذكرني</span>
                  </label>
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">نسيت كلمة المرور؟</a>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all hover:-translate-y-0.5"
              >
                {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <span className="text-slate-400 text-sm">أو</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <img src="https://www.svgrepo.com/show/448234/microsoft.svg" className="w-5 h-5" alt="Microsoft" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Microsoft</span>
              </button>
            </div>

            <p className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              {' '}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-primary-600 font-bold hover:underline"
              >
                {isLogin ? 'سجل الآن' : 'سجل الدخول'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;