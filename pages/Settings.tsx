import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState({
    firstName: 'أحمد',
    lastName: 'عبدالله',
    email: 'ahmed@example.com'
  });

  const [notifications, setNotifications] = useState({
    homework: true,
    weekly: true
  });

  const [fontSize, setFontSize] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('تم حفظ الإعدادات بنجاح!');
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">إعدادات الحساب</h1>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
        <div className="relative">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP-21jzbdNa6NazqRW4tIFmDibvlK3NHLdeoFo3096ErA05KkUBgemQEv6N-fZdxNVUTcgoFHzyhTDkjdI-D-koTAzZNTedkhoTRADpi298ZdCHu7UrIW8DYhfjG9DDNqRJdQR4665ZfqnEu8VSdWa2X0ynKHW2vv3R9FcmGCox-i2xmR10WzZ0yiBo3SZec9jkHmcjhT3nf5Xfewtud2yqYF9PbWn5y-qutXYA5R_DmmJUIGp4hVzjz_pwi1FqU5fQzVWiUUf6T4" 
            alt="Profile" 
            className="size-20 rounded-full border-4 border-slate-50 dark:border-slate-800"
          />
          <button className="absolute bottom-0 left-0 bg-primary-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900 hover:bg-primary-600">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.firstName} {profile.lastName}</h2>
          <p className="text-slate-500 dark:text-slate-400">طالب - الصف الخامس</p>
        </div>
      </div>

      {/* Form Sections */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-700 dark:text-slate-300">المعلومات الشخصية</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الاسم الأول</label>
              <input 
                type="text" 
                value={profile.firstName}
                onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">اسم العائلة</label>
              <input 
                type="text" 
                value={profile.lastName}
                onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-700 dark:text-slate-300">التفضيلات والإشعارات</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
             <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">إشعارات التذكير بالواجبات</span>
             <label className="relative inline-flex items-center cursor-pointer">
               <input 
                 type="checkbox" 
                 className="sr-only peer" 
                 checked={notifications.homework}
                 onChange={() => setNotifications({...notifications, homework: !notifications.homework})}
               />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
             </label>
          </div>
          <div className="flex items-center justify-between">
             <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">رسائل تحفيزية أسبوعية</span>
             <label className="relative inline-flex items-center cursor-pointer">
               <input 
                 type="checkbox" 
                 className="sr-only peer" 
                 checked={notifications.weekly}
                 onChange={() => setNotifications({...notifications, weekly: !notifications.weekly})}
               />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
             </label>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">حجم الخط: {fontSize === 1 ? 'صغير' : fontSize === 2 ? 'متوسط' : 'كبير'}</label>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="1" 
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary-500" 
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>صغير</span>
              <span>متوسط</span>
              <span>كبير</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 sticky bottom-4">
        <button className="px-6 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-bold transition-colors">إلغاء</button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
              جاري الحفظ...
            </>
          ) : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
};

export default Settings;