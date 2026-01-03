import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const skillsData = [
  { subject: 'النحو', A: 85, fullMark: 100 },
  { subject: 'الإملاء', A: 65, fullMark: 100 },
  { subject: 'القراءة', A: 90, fullMark: 100 },
  { subject: 'البلاغة', A: 70, fullMark: 100 },
  { subject: 'الأدب', A: 80, fullMark: 100 },
];

const historyData = [
  { name: 'أسبوع 1', score: 60 },
  { name: 'أسبوع 2', score: 72 },
  { name: 'أسبوع 3', score: 68 },
  { name: 'أسبوع 4', score: 85 },
  { name: 'أسبوع 5', score: 92 },
];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">تحليلات الأداء الشاملة</h1>
          <p className="text-slate-500 dark:text-slate-400">تتبع تقدمك في جميع المهارات اللغوية</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm">
            <option>الفصل الدراسي الأول</option>
            <option>الفصل الدراسي الثاني</option>
          </select>
          <button className="bg-primary-500 text-white p-2 rounded-lg shadow-lg shadow-primary-500/30">
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Radar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">pentagon</span>
            تحليل المهارات
          </h3>
          <div className="h-[350px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 14 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="الدرجة" dataKey="A" stroke="#13ec5b" strokeWidth={3} fill="#13ec5b" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/30">
            <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
              <span className="material-symbols-outlined">lightbulb</span>
              <strong>نصيحة:</strong> مستواك في "الإملاء" يحتاج لبعض التحسين. جرب مراجعة درس "الهمزة المتوسطة".
            </p>
          </div>
        </div>

        {/* Progress Line */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">timeline</span>
            تطور المستوى الأكاديمي
          </h3>
          <div className="h-[350px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
             <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
               <p className="text-xs text-slate-500 dark:text-slate-400">أعلى درجة</p>
               <p className="text-xl font-bold text-green-600 dark:text-green-400">92%</p>
             </div>
             <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
               <p className="text-xs text-slate-500 dark:text-slate-400">معدل التحسن</p>
               <p className="text-xl font-bold text-blue-600 dark:text-blue-400">+32%</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;