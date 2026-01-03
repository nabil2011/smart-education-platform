import React, { useState } from 'react';
import Modal from '../components/Modal';

interface RecoveryPlan {
  id: number;
  weekNumber: number;
  title: string;
  description: string;
  subject: string;
  gradeLevel: number;
  actions: string[];
  files: string[];
  targetStudents: string[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  completionRate: number;
}

const mockRecoveryPlans: RecoveryPlan[] = [
  {
    id: 1,
    weekNumber: 1,
    title: 'تعويض الفاقد في الكسور العشرية',
    description: 'خطة شاملة لتعويض الطلاب الذين يواجهون صعوبة في فهم الكسور العشرية',
    subject: 'رياضيات',
    gradeLevel: 5,
    actions: [
      'مراجعة مفهوم الكسور الاعتيادية',
      'شرح العلاقة بين الكسور الاعتيادية والعشرية',
      'تطبيق عملي على تحويل الكسور',
      'حل تمارين متدرجة الصعوبة'
    ],
    files: ['ورقة_عمل_الكسور.pdf', 'أمثلة_تطبيقية.docx'],
    targetStudents: ['أحمد محمد', 'فاطمة علي', 'محمد حسن'],
    createdBy: 'أ. سارة أحمد',
    createdAt: '2024-01-08',
    isActive: true,
    completionRate: 67
  },
  {
    id: 2,
    weekNumber: 2,
    title: 'تقوية مهارات القراءة والفهم',
    description: 'برنامج مكثف لتحسين مهارات القراءة والاستيعاب للطلاب المتأخرين',
    subject: 'لغة عربية',
    gradeLevel: 4,
    actions: [
      'قراءة نصوص قصيرة ومناسبة للمستوى',
      'تدريب على استخراج الأفكار الرئيسية',
      'تنمية المفردات من خلال السياق',
      'أنشطة تفاعلية للفهم والاستيعاب'
    ],
    files: ['نصوص_القراءة.pdf', 'تدريبات_الفهم.docx', 'قاموس_المفردات.pdf'],
    targetStudents: ['خالد عمر', 'نور محمود', 'يوسف سالم', 'مريم أحمد'],
    createdBy: 'أ. محمد عبدالله',
    createdAt: '2024-01-15',
    isActive: true,
    completionRate: 45
  },
  {
    id: 3,
    weekNumber: 3,
    title: 'مراجعة أساسيات الضرب والقسمة',
    description: 'خطة تعويضية لتقوية الطلاب في عمليات الضرب والقسمة الأساسية',
    subject: 'رياضيات',
    gradeLevel: 3,
    actions: [
      'مراجعة جداول الضرب من 1 إلى 10',
      'تطبيق عملي على مسائل الضرب',
      'فهم العلاقة بين الضرب والقسمة',
      'حل مسائل حياتية بسيطة'
    ],
    files: ['جداول_الضرب.pdf', 'تمارين_الضرب_والقسمة.docx'],
    targetStudents: ['عبدالله محمد', 'زينب حسن'],
    createdBy: 'أ. فاطمة خالد',
    createdAt: '2024-01-22',
    isActive: true,
    completionRate: 80
  },
  {
    id: 4,
    weekNumber: 1,
    title: 'تعزيز فهم النظام الشمسي',
    description: 'برنامج تعويضي لتحسين فهم الطلاب لمكونات النظام الشمسي',
    subject: 'علوم',
    gradeLevel: 6,
    actions: [
      'مراجعة أسماء الكواكب وترتيبها',
      'فهم خصائص كل كوكب',
      'تطبيق عملي بالنماذج والصور',
      'اختبار تقييمي نهائي'
    ],
    files: ['النظام_الشمسي.pptx', 'صور_الكواكب.zip', 'نشاط_تفاعلي.pdf'],
    targetStudents: ['سارة عمر', 'أحمد سالم', 'ليلى محمود'],
    createdBy: 'أ. عمر إبراهيم',
    createdAt: '2024-01-05',
    isActive: false,
    completionRate: 100
  }
];

const RecoveryPlans: React.FC = () => {
  const [plans] = useState<RecoveryPlan[]>(mockRecoveryPlans);
  const [selectedPlan, setSelectedPlan] = useState<RecoveryPlan | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Get unique subjects and weeks
  const subjects = Array.from(new Set(plans.map(plan => plan.subject)));
  const weeks = Array.from(new Set(plans.map(plan => plan.weekNumber))).sort((a, b) => a - b);

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    const matchesWeek = filterWeek === 'all' || plan.weekNumber.toString() === filterWeek;
    const matchesSubject = filterSubject === 'all' || plan.subject === filterSubject;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && plan.isActive) ||
      (filterStatus === 'completed' && !plan.isActive);
    return matchesWeek && matchesSubject && matchesStatus;
  });

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'رياضيات': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'لغة عربية': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'علوم': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'تاريخ': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
      case 'جغرافيا': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">خطط تعويض الفاقد التعليمي</h1>
          <p className="text-slate-500 dark:text-slate-400">برامج مخصصة لمساعدة الطلاب على استدراك ما فاتهم من المنهج</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          إنشاء خطة جديدة
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي الخطط', value: plans.length, icon: 'assignment', color: 'bg-blue-500' },
          { label: 'الخطط النشطة', value: plans.filter(p => p.isActive).length, icon: 'play_circle', color: 'bg-green-500' },
          { label: 'الخطط المكتملة', value: plans.filter(p => !p.isActive).length, icon: 'check_circle', color: 'bg-purple-500' },
          { label: 'الطلاب المستفيدون', value: Array.from(new Set(plans.flatMap(p => p.targetStudents))).length, icon: 'groups', color: 'bg-orange-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الأسبوع</label>
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">جميع الأسابيع</option>
              {weeks.map(week => (
                <option key={week} value={week.toString()}>الأسبوع {week}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المادة</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">جميع المواد</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشطة</option>
              <option value="completed">مكتملة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 dark:bg-primary-900/20 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary-600">healing</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الأسبوع {plan.weekNumber}</span>
                  <p className="text-xs text-slate-400">الصف {plan.gradeLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getSubjectColor(plan.subject)}`}>
                  {plan.subject}
                </span>
                <div className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {plan.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
              {plan.description}
            </p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">معدل الإنجاز</span>
                <span className={`text-xs font-bold ${getCompletionColor(plan.completionRate)}`}>
                  {plan.completionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    plan.completionRate >= 80 ? 'bg-green-500' :
                    plan.completionRate >= 60 ? 'bg-yellow-500' :
                    plan.completionRate >= 40 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${plan.completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  <span>{plan.targetStudents.length} طالب</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">attach_file</span>
                  <span>{plan.files.length} ملف</span>
                </div>
              </div>
              <span>{new Date(plan.createdAt).toLocaleDateString('ar-EG')}</span>
            </div>

            {/* Creator */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                  {plan.createdBy.charAt(0)}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{plan.createdBy}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">healing</span>
          <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">لا توجد خطط تعويض</h3>
          <p className="text-slate-400">لا توجد خطط تطابق المعايير المحددة</p>
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title="تفاصيل خطة التعويض">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 dark:bg-primary-900/20 p-3 rounded-xl">
                <span className="material-symbols-outlined text-primary-600 text-2xl">healing</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedPlan.title}</h2>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span>الأسبوع {selectedPlan.weekNumber}</span>
                  <span>•</span>
                  <span>{selectedPlan.subject}</span>
                  <span>•</span>
                  <span>الصف {selectedPlan.gradeLevel}</span>
                  <span className={`px-2 py-1 rounded ${selectedPlan.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'}`}>
                    {selectedPlan.isActive ? 'نشطة' : 'مكتملة'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-3">وصف الخطة</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                {selectedPlan.description}
              </p>
            </div>

            {/* Actions */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-3">الإجراءات المطلوبة</h4>
              <div className="space-y-2">
                {selectedPlan.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-3">معدل الإنجاز</h4>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400">التقدم الحالي</span>
                  <span className={`font-bold ${getCompletionColor(selectedPlan.completionRate)}`}>
                    {selectedPlan.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      selectedPlan.completionRate >= 80 ? 'bg-green-500' :
                      selectedPlan.completionRate >= 60 ? 'bg-yellow-500' :
                      selectedPlan.completionRate >= 40 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${selectedPlan.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Target Students */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-3">الطلاب المستهدفون ({selectedPlan.targetStudents.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlan.targetStudents.map((student, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                    {student}
                  </span>
                ))}
              </div>
            </div>

            {/* Files */}
            {selectedPlan.files.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-3">الملفات المرفقة</h4>
                <div className="space-y-2">
                  {selectedPlan.files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="material-symbols-outlined text-slate-500">attach_file</span>
                      <span className="flex-1 text-slate-700 dark:text-slate-300">{file}</span>
                      <button className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-1 rounded">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creator Info */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">منشئ الخطة</p>
                  <p className="text-slate-600 dark:text-slate-400">{selectedPlan.createdBy}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">تاريخ الإنشاء</p>
                  <p className="text-slate-600 dark:text-slate-400">{new Date(selectedPlan.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold">
                تحديث الخطة
              </button>
              <button className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                تقرير التقدم
              </button>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Plan Modal */}
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إنشاء خطة تعويض جديدة">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رقم الأسبوع</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="1"
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المادة</label>
                <select className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">اختر المادة</option>
                  <option value="رياضيات">رياضيات</option>
                  <option value="لغة عربية">لغة عربية</option>
                  <option value="علوم">علوم</option>
                  <option value="تاريخ">تاريخ</option>
                  <option value="جغرافيا">جغرافيا</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الصف</label>
                <select className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">اختر الصف</option>
                  <option value="1">الأول</option>
                  <option value="2">الثاني</option>
                  <option value="3">الثالث</option>
                  <option value="4">الرابع</option>
                  <option value="5">الخامس</option>
                  <option value="6">السادس</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان الخطة</label>
              <input 
                type="text" 
                placeholder="مثال: تعويض الفاقد في الكسور العشرية"
                className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">وصف الخطة</label>
              <textarea 
                placeholder="اكتب وصفاً شاملاً للخطة وأهدافها..."
                className="w-full h-32 py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الإجراءات المطلوبة</label>
              <textarea 
                placeholder="اكتب كل إجراء في سطر منفصل..."
                className="w-full h-32 py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رفع الملفات</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">cloud_upload</span>
                <p className="text-slate-500 dark:text-slate-400 mb-2">اسحب الملفات هنا أو انقر للاختيار</p>
                <button className="text-primary-600 font-bold text-sm">اختيار ملفات</button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold">
                إنشاء الخطة
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RecoveryPlans;