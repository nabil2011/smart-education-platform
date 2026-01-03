import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';

const studentData = [
  { name: 'ممتاز', count: 12 },
  { name: 'جيد جداً', count: 18 },
  { name: 'جيد', count: 8 },
  { name: 'يحتاج دعم', count: 5 },
];

const initialAssignments = [
  { id: 1, title: 'تحليل قصيدة "أحمد شوقي"', type: 'تحليل أدبي', due: '2023-10-25', submitted: 38, total: 43 },
  { id: 2, title: 'إعراب سورة الفاتحة', type: 'نحو', due: '2023-10-28', submitted: 12, total: 43 },
];

const submissionsMock = [
  { id: 1, student: 'أحمد عبدالله', grade: 95, date: '2023-10-24', status: 'completed', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBP-21jzbdNa6NazqRW4tIFmDibvlK3NHLdeoFo3096ErA05KkUBgemQEv6N-fZdxNVUTcgoFHzyhTDkjdI-D-koTAzZNTedkhoTRADpi298ZdCHu7UrIW8DYhfjG9DDNqRJdQR4665ZfqnEu8VSdWa2X0ynKHW2vv3R9FcmGCox-i2xmR10WzZ0yiBo3SZec9jkHmcjhT3nf5Xfewtud2yqYF9PbWn5y-qutXYA5R_DmmJUIGp4hVzjz_pwi1FqU5fQzVWiUUf6T4' },
  { id: 2, student: 'سارة محمد', grade: 88, date: '2023-10-24', status: 'completed', avatar: null },
  { id: 3, student: 'خالد عمر', grade: null, date: null, status: 'pending', avatar: null },
  { id: 4, student: 'يوسف حسن', grade: 92, date: '2023-10-23', status: 'completed', avatar: null },
  { id: 5, student: 'منى علي', grade: null, date: null, status: 'pending', avatar: null },
];

const studentsNeedAttention = [
  { id: 1, name: 'محمد علي', issue: 'انخفاض في درجات النحو', risk: 'high', average: 65, attendance: '85%' },
  { id: 2, name: 'سارة أحمد', issue: 'غياب متكرر', risk: 'medium', average: 78, attendance: '60%' },
  { id: 3, name: 'خالد عمر', issue: 'لم يسلم الواجب الأخير', risk: 'medium', average: 72, attendance: '90%' },
];

const TeacherDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState(initialAssignments);
  
  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'completed' | 'pending'>('all');
  
  // Form State
  const [newAssignment, setNewAssignment] = useState({ title: '', type: 'نحو', due: '' });

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.due) return;

    const newItem = {
      id: Date.now(),
      title: newAssignment.title,
      type: newAssignment.type,
      due: newAssignment.due,
      submitted: 0,
      total: 43
    };

    setAssignments([newItem, ...assignments]);
    setNewAssignment({ title: '', type: 'نحو', due: '' });
    setIsAddModalOpen(false);
  };

  const sendReminder = (studentName: string) => {
    alert(`تم إرسال تذكير للطالب ${studentName} وولي أمره بنجاح!`);
    setSelectedStudent(null);
  };

  // Filter submissions based on selected tab
  const filteredSubmissions = submissionsMock.filter(sub => {
    if (submissionFilter === 'all') return true;
    return sub.status === submissionFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">لوحة تحكم المعلم</h1>
          <p className="text-slate-500 dark:text-slate-400">نظرة عامة على أداء الصف الخامس - شعبة أ</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <span className="material-symbols-outlined">add</span>
          واجب جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي الطلاب', value: '43', icon: 'groups', change: '+2', color: 'bg-blue-500' },
          { label: 'متوسط الدرجات', value: '82%', icon: 'show_chart', change: '+5%', color: 'bg-green-500' },
          { label: 'الواجبات المسلمة', value: `${assignments.reduce((acc, curr) => acc + curr.submitted, 0)}`, icon: 'assignment_turned_in', change: 'نشط', color: 'bg-purple-500' },
          { label: 'طلاب يحتاجون لدعم', value: '5', icon: 'warning', change: '-1', color: 'bg-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-2 font-medium">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                {stat.change}
              </p>
            </div>
            <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-gray-200 dark:shadow-none`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">توزيع مستوى الطلاب</h3>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                  <Bar dataKey="count" fill="#13ec5b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Assignments List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">الواجبات النشطة</h3>
             <div className="space-y-3">
               {assignments.map((assignment) => (
                 <div 
                   key={assignment.id} 
                   onClick={() => setSelectedAssignment(assignment)}
                   className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                 >
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-lg flex items-center justify-center text-white font-bold transition-transform group-hover:scale-110
                        ${assignment.type === 'نحو' ? 'bg-blue-500' : 'bg-pink-500'}
                      `}>
                        {assignment.type === 'نحو' ? 'ن' : 'أ'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">{assignment.title}</h4>
                        <p className="text-xs text-slate-500">آخر موعد: {assignment.due}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{assignment.submitted}/{assignment.total}</span>
                      <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary-500 h-1.5 rounded-full" 
                          style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                        />
                      </div>
                    </div>
                 </div>
               ))}
               {assignments.length === 0 && (
                 <p className="text-center text-slate-500 py-4">لا توجد واجبات نشطة حالياً</p>
               )}
             </div>
          </div>
        </div>

        {/* Needs Attention List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">طلاب يحتاجون للمتابعة</h3>
          <div className="space-y-4">
            {studentsNeedAttention.map((student, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedStudent(student)}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="size-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 font-bold">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{student.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{student.issue}</p>
                </div>
                <span className={`size-2.5 rounded-full mt-2 ${student.risk === 'high' ? 'bg-red-500' : 'bg-orange-400'}`}></span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 text-primary-600 text-sm font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 py-3 rounded-xl transition-colors">
            عرض كل الطلاب
          </button>
        </div>
      </div>

      {/* Add Assignment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة واجب جديد">
        <form onSubmit={handleAddAssignment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">عنوان الواجب</label>
            <input 
              type="text" 
              required
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
              placeholder="مثال: مراجعة الوحدة الأولى"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع الواجب</label>
              <select 
                value={newAssignment.type}
                onChange={(e) => setNewAssignment({...newAssignment, type: e.target.value})}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="نحو">نحو</option>
                <option value="قراءة">قراءة</option>
                <option value="إملاء">إملاء</option>
                <option value="تحليل أدبي">تحليل أدبي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تاريخ التسليم</label>
              <input 
                type="date" 
                required
                value={newAssignment.due}
                onChange={(e) => setNewAssignment({...newAssignment, due: e.target.value})}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 rounded-xl font-bold bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all"
            >
              نشر الواجب
            </button>
          </div>
        </form>
      </Modal>

      {/* Enhanced View Assignment Modal */}
      {selectedAssignment && (
        <Modal isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} title="تفاصيل الواجب">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedAssignment.title}</h2>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    يستحق في: {selectedAssignment.due}
                  </span>
                  <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded text-xs font-bold">
                    {selectedAssignment.type}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {Math.round((selectedAssignment.submitted / selectedAssignment.total) * 100)}%
                </span>
                <span className="text-xs text-slate-500">نسبة الإنجاز</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-3 rounded-xl text-center">
                <p className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">تم التسليم</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{selectedAssignment.submitted}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 p-3 rounded-xl text-center">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">قيد الانتظار</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{selectedAssignment.total - selectedAssignment.submitted}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-3 rounded-xl text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">متوسط الدرجات</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">88%</p>
              </div>
            </div>

            {/* Submissions Section */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setSubmissionFilter('all')}
                    className={`text-sm font-bold pb-2 border-b-2 transition-all ${submissionFilter === 'all' ? 'text-primary-600 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                  >
                    الكل
                  </button>
                  <button 
                    onClick={() => setSubmissionFilter('completed')}
                    className={`text-sm font-bold pb-2 border-b-2 transition-all ${submissionFilter === 'completed' ? 'text-primary-600 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                  >
                    تم التسليم
                  </button>
                  <button 
                    onClick={() => setSubmissionFilter('pending')}
                    className={`text-sm font-bold pb-2 border-b-2 transition-all ${submissionFilter === 'pending' ? 'text-primary-600 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                  >
                    لم يسلم
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3">
                         <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold overflow-hidden">
                           {sub.avatar ? <img src={sub.avatar} className="w-full h-full object-cover" alt={sub.student} /> : sub.student.charAt(0)}
                         </div>
                         <div>
                           <p className="text-sm font-bold text-slate-800 dark:text-white">{sub.student}</p>
                           <p className="text-[10px] text-slate-500 flex items-center gap-1">
                             {sub.status === 'completed' ? (
                               <><span className="size-1.5 rounded-full bg-green-500"></span> تم التسليم {sub.date}</>
                             ) : (
                               <><span className="size-1.5 rounded-full bg-orange-500"></span> لم يسلم بعد</>
                             )}
                           </p>
                         </div>
                      </div>
                      
                      {sub.status === 'completed' ? (
                        <div className="flex items-center gap-3">
                          <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg font-bold text-sm">
                            {sub.grade}%
                          </span>
                          <button className="text-slate-400 hover:text-primary-500 p-1">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                        </div>
                      ) : (
                        <button className="text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-primary-500/20">
                          <span className="material-symbols-outlined text-sm">notifications</span>
                          تذكير
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">filter_list_off</span>
                    <p>لا توجد نتائج لهذا التصنيف</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
               <button className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-bold transition-colors">تصدير لـ Excel</button>
               <button 
                 onClick={() => setSelectedAssignment(null)}
                 className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
               >
                 إغلاق
               </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Student Modal */}
      {selectedStudent && (
        <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="ملف الطالب">
          <div className="text-center mb-6">
            <div className="size-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500 mx-auto mb-3">
              {selectedStudent.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h2>
            <p className="text-sm text-slate-500">الصف الخامس - شعبة أ</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-center">
              <span className="material-symbols-outlined text-red-500 mb-1">warning</span>
              <p className="text-xs text-red-600 dark:text-red-400 font-bold">المشكلة الحالية</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedStudent.issue}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl text-center">
              <span className="material-symbols-outlined text-blue-500 mb-1">bar_chart</span>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">المعدل العام</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{selectedStudent.average}%</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
               <span className="text-sm text-slate-600 dark:text-slate-300">نسبة الحضور</span>
               <span className="font-bold text-slate-900 dark:text-white">{selectedStudent.attendance}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
               <span className="text-sm text-slate-600 dark:text-slate-300">مستوى المشاركة</span>
               <span className="font-bold text-slate-900 dark:text-white">متوسط</span>
            </div>
          </div>

          <div className="flex gap-3">
             <button className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
               سجل الدرجات
             </button>
             <button 
               onClick={() => sendReminder(selectedStudent.name)}
               className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
             >
               <span className="material-symbols-outlined text-lg">notifications_active</span>
               إرسال تذكير
             </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeacherDashboard;