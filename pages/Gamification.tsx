import React, { useState } from 'react';

const Gamification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard'>('badges');

  const badges = [
    { id: 1, name: 'نجم النحو', icon: 'auto_awesome', description: 'أكمل 10 دروس في النحو بنسبة 100%', earned: true, date: '2023-10-15' },
    { id: 2, name: 'المواظب', icon: 'calendar_month', description: 'دخول يومي لمدة أسبوع', earned: true, date: '2023-10-20' },
    { id: 3, name: 'الفصيح', icon: 'record_voice_over', description: 'سجل 5 قراءات صحيحة', earned: false, progress: 60 },
    { id: 4, name: 'المتألق', icon: 'workspace_premium', description: 'احصل على المركز الأول في لوحة الشرف', earned: false, progress: 20 },
    { id: 5, name: 'سريع البديهة', icon: 'bolt', description: 'حل اختبار كامل في أقل من دقيقتين', earned: false, progress: 0 },
    { id: 6, name: 'المساعد', icon: 'handshake', description: 'ساعد 3 زملاء في حل الواجبات', earned: false, progress: 33 },
  ];

  const leaderboard = [
    { rank: 1, name: 'سارة محمد', points: 1250, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara' },
    { rank: 2, name: 'أحمد عبدالله', points: 1180, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBP-21jzbdNa6NazqRW4tIFmDibvlK3NHLdeoFo3096ErA05KkUBgemQEv6N-fZdxNVUTcgoFHzyhTDkjdI-D-koTAzZNTedkhoTRADpi298ZdCHu7UrIW8DYhfjG9DDNqRJdQR4665ZfqnEu8VSdWa2X0ynKHW2vv3R9FcmGCox-i2xmR10WzZ0yiBo3SZec9jkHmcjhT3nf5Xfewtud2yqYF9PbWn5y-qutXYA5R_DmmJUIGp4hVzjz_pwi1FqU5fQzVWiUUf6T4', isMe: true },
    { rank: 3, name: 'خالد عمر', points: 1050, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khalid' },
    { rank: 4, name: 'منى علي', points: 980, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mona' },
    { rank: 5, name: 'يوسف حسن', points: 920, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yousef' },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-yellow-100 mb-1 font-medium">مجموع النقاط</p>
            <h2 className="text-4xl font-black">1,180</h2>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -left-4 text-8xl text-white/20">stars</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="size-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined text-3xl">military_tech</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">المستوى الحالي</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">المستوى 4</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="size-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <span className="material-symbols-outlined text-3xl">leaderboard</span>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">الترتيب العام</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">#2</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mx-auto">
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'badges'
              ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          الشارات والجوائز
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          لوحة المتصدرين
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'badges' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`relative group p-6 rounded-2xl border transition-all duration-300 ${
                  badge.earned 
                    ? 'bg-white dark:bg-slate-900 border-primary-200 dark:border-primary-900/50 shadow-md hover:shadow-lg hover:-translate-y-1' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-75'
                }`}
              >
                <div className={`size-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl shadow-inner ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-orange-500/20' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  <span className="material-symbols-outlined">{badge.icon}</span>
                </div>
                
                <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">{badge.name}</h3>
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4 h-10">{badge.description}</p>
                
                {badge.earned ? (
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 py-1 px-3 rounded-full w-fit mx-auto">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>تم الحصول عليها</span>
                  </div>
                ) : (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-slate-400 h-2 rounded-full transition-all" 
                      style={{ width: `${badge.progress}%` }}
                    />
                    <p className="text-center text-xs text-slate-400 mt-1">{badge.progress}% مكتمل</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
               <span className="text-sm font-bold text-slate-500 px-4">الترتيب</span>
               <span className="text-sm font-bold text-slate-500 px-4">الطالب</span>
               <span className="text-sm font-bold text-slate-500 px-4">النقاط</span>
            </div>
            {leaderboard.map((user, index) => (
              <div 
                key={index} 
                className={`flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800 ${user.isMe ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
              >
                <div className="w-16 flex justify-center">
                  {index < 3 ? (
                    <div className={`size-8 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                      index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : 'bg-orange-300'
                    }`}>
                      {user.rank}
                    </div>
                  ) : (
                    <span className="font-bold text-slate-500">{user.rank}</span>
                  )}
                </div>
                
                <div className="flex-1 flex items-center gap-4">
                  <img src={user.avatar} alt={user.name} className="size-10 rounded-full border border-slate-200 dark:border-slate-700" />
                  <div>
                    <p className={`font-bold ${user.isMe ? 'text-primary-700 dark:text-primary-400' : 'text-slate-800 dark:text-white'}`}>
                      {user.name} {user.isMe && '(أنت)'}
                    </p>
                    {index === 0 && <p className="text-xs text-yellow-500 font-bold">👑 المتصدر لهذا الأسبوع</p>}
                  </div>
                </div>
                
                <div className="w-24 text-center font-bold text-slate-700 dark:text-slate-300">
                  {user.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gamification;