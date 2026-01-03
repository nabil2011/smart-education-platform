import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Mock Data
const systemStats = {
  totalUsers: 15420,
  totalSchools: 45,
  totalContent: 8750,
  activeUsers: 3240,
  systemUptime: 99.8,
  contentUsage: 87.5
};

const schoolsData = [
  { name: 'مدرسة النور الابتدائية', students: 450, teachers: 25, performance: 92 },
  { name: 'مدرسة الأمل الابتدائية', students: 380, teachers: 22, performance: 88 },
  { name: 'مدرسة المستقبل الابتدائية', students: 520, teachers: 28, performance: 95 },
  { name: 'مدرسة الفجر الابتدائية', students: 320, teachers: 18, performance: 85 },
  { name: 'مدرسة الرياض الابتدائية', students: 410, teachers: 24, performance: 90 }
];

const usageData = [
  { month: 'يناير', students: 1200, teachers: 180, content: 450 },
  { month: 'فبراير', students: 1350, teachers: 195, content: 520 },
  { month: 'مارس', students: 1480, teachers: 210, content: 680 },
  { month: 'أبريل', students: 1620, teachers: 225, content: 750 },
  { month: 'مايو', students: 1750, teachers: 240, content: 820 },
  { month: 'يونيو', students: 1890, teachers: 255, content: 920 }
];

const contentTypeData = [
  { name: 'دروس تفاعلية', value: 35, color: '#3B82F6' },
  { name: 'اختبارات', value: 25, color: '#10B981' },
  { name: 'محتوى ذكي', value: 20, color: '#8B5CF6' },
  { name: 'فيديوهات', value: 15, color: '#F59E0B' },
  { name: 'أخرى', value: 5, color: '#EF4444' }
];

const AdminDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">لوحة تحكم الإدارة</h1>
          <p className="text-slate-500 dark:text-slate-400">نظرة شاملة على النظام التعليمي</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm"
          >
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined">download</span>
            تصدير التقرير
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: 'إجمالي المستخدمين', value: systemStats.totalUsers.toLocaleString(), icon: 'groups', change: '+12%', color: 'bg-blue-500' },
          { label: 'المدارس المسجلة', value: systemStats.totalSchools.toString(), icon: 'domain', change: '+3', color: 'bg-green-500' },
          { label: 'المحتوى التعليمي', value: systemStats.totalContent.toLocaleString(), icon: 'library_books', change: '+8%', color: 'bg-purple-500' },
          { label: 'المستخدمون النشطون', value: systemStats.activeUsers.toLocaleString(), icon: 'trending_up', change: '+15%', color: 'bg-orange-500' },
          { label: 'وقت التشغيل', value: `${systemStats.systemUptime}%`, icon: 'speed', change: 'مستقر', color: 'bg-cyan-500' },
          { label: 'استخدام المحتوى', value: `${systemStats.contentUsage}%`, icon: 'analytics', change: '+5%', color: 'bg-pink-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
              <span className="text-xs text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Usage Analytics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">إحصائيات الاستخدام</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">الطلاب</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">المعلمون</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">المحتوى</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="teachers" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="content" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">توزيع المحتوى</h3>
          <div className="h-[200px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {contentTypeData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schools Performance */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">أداء المدارس</h3>
          <button className="text-primary-600 text-sm font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-lg">
            عرض التفاصيل
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-right py-3 px-4 font-bold text-slate-700 dark:text-slate-300">المدرسة</th>
                <th className="text-center py-3 px-4 font-bold text-slate-700 dark:text-slate-300">الطلاب</th>
                <th className="text-center py-3 px-4 font-bold text-slate-700 dark:text-slate-300">المعلمون</th>
                <th className="text-center py-3 px-4 font-bold text-slate-700 dark:text-slate-300">الأداء</th>
                <th className="text-center py-3 px-4 font-bold text-slate-700 dark:text-slate-300">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {schoolsData.map((school, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary-600">domain</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{school.name}</p>
                        <p className="text-xs text-slate-500">مدرسة حكومية</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{school.students}</span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{school.teachers}</span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${school.performance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{school.performance}%</span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <button 
                      onClick={() => setSelectedSchool(school)}
                      className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-2 rounded-lg"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'إضافة مدرسة جديدة', icon: 'add_business', color: 'bg-blue-500' },
          { title: 'إدارة المستخدمين', icon: 'manage_accounts', color: 'bg-green-500' },
          { title: 'مراجعة المحتوى', icon: 'fact_check', color: 'bg-purple-500' },
          { title: 'إعدادات النظام', icon: 'settings', color: 'bg-orange-500' }
        ].map((action, i) => (
          <button key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group text-right">
            <div className={`${action.color} p-3 rounded-xl text-white shadow-lg mb-4 w-fit group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-xl">{action.icon}</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">{action.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">انقر للوصول السريع</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;