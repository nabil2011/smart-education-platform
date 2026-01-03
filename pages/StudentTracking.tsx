import React, { useState } from 'react';
import Modal from '../components/Modal';

interface StudentTrackingEntry {
  id: number;
  studentId: number;
  studentName: string;
  studentAvatar?: string;
  trackingType: 'academic' | 'behavioral' | 'social' | 'attendance' | 'health';
  title: string;
  details: string;
  trackingDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  followUpDate?: string;
  notes?: string;
  createdAt: string;
}

const mockTrackingData: StudentTrackingEntry[] = [
  {
    id: 1,
    studentId: 101,
    studentName: 'أحمد محمد علي',
    trackingType: 'academic',
    title: 'انخفاض في درجات الرياضيات',
    details: 'لوحظ انخفاض ملحوظ في درجات الطالب في مادة الرياضيات خلال الأسبوعين الماضيين. يحتاج لدعم إضافي في موضوع الكسور.',
    trackingDate: '2024-01-10',
    priority: 'high',
    status: 'in_progress',
    followUpDate: '2024-01-17',
    notes: 'تم التواصل مع ولي الأمر وتحديد جلسات دعم إضافية',
    createdAt: '2024-01-10'
  },
  {
    id: 2,
    studentId: 102,
    studentName: 'فاطمة أحمد حسن',
    trackingType: 'behavioral',
    title: 'تحسن ملحوظ في السلوك',
    details: 'أظهرت الطالبة تحسناً كبيراً في التفاعل مع زملائها والمشاركة في الأنشطة الصفية.',
    trackingDate: '2024-01-08',
    priority: 'medium',
    status: 'resolved',
    notes: 'استمرار المتابعة الإيجابية',
    createdAt: '2024-01-08'
  },
  {
    id: 3,
    studentId: 103,
    studentName: 'محمد عبدالله سالم',
    trackingType: 'attendance',
    title: 'غياب متكرر',
    details: 'غاب الطالب 5 أيام خلال الأسبوعين الماضيين دون عذر مقبول. يؤثر ذلك على تحصيله الدراسي.',
    trackingDate: '2024-01-12',
    priority: 'urgent',
    status: 'open',
    followUpDate: '2024-01-15',
    createdAt: '2024-01-12'
  },
  {
    id: 4,
    studentId: 104,
    studentName: 'سارة خالد محمود',
    trackingType: 'social',
    title: 'صعوبة في التكيف الاجتماعي',
    details: 'تواجه الطالبة صعوبة في تكوين صداقات والاندماج مع زملائها في الصف.',
    trackingDate: '2024-01-05',
    priority: 'medium',
    status: 'in_progress',
    followUpDate: '2024-01-19',
    notes: 'تم تطبيق أنشطة جماعية لتعزيز التفاعل الاجتماعي',
    createdAt: '2024-01-05'
  },
  {
    id: 5,
    studentId: 105,
    studentName: 'يوسف عمر إبراهيم',
    trackingType: 'health',
    title: 'مشاكل في الرؤية',
    details: 'لوحظ أن الطالب يواجه صعوبة في قراءة النصوص على السبورة ويحتاج لفحص نظر.',
    trackingDate: '2024-01-07',
    priority: 'high',
    status: 'resolved',
    notes: 'تم إبلاغ ولي الأمر وحصل الطالب على نظارة طبية',
    createdAt: '2024-01-07'
  }
];

const StudentTracking: React.FC = () => {
  const [trackingEntries] = useState<StudentTrackingEntry[]>(mockTrackingData);
  const [selectedEntry, setSelectedEntry] = useState<StudentTrackingEntry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Filter entries
  const filteredEntries = trackingEntries.filter(entry => {
    const matchesType = filterType === 'all' || entry.trackingType === filterType;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || entry.priority === filterPriority;
    return matchesType && matchesStatus && matchesPriority;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return 'school';
      case 'behavioral': return 'psychology';
      case 'social': return 'groups';
      case 'attendance': return 'event_available';
      case 'health': return 'health_and_safety';
      default: return 'person';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'behavioral': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'social': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'attendance': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
      case 'health': return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'academic': return 'أكاديمي';
      case 'behavioral': return 'سلوكي';
      case 'social': return 'اجتماعي';
      case 'attendance': return 'حضور';
      case 'health': return 'صحي';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
      case 'medium': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
      case 'urgent': return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'منخفضة';
      case 'medium': return 'متوسطة';
      case 'high': return 'عالية';
      case 'urgent': return 'عاجلة';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'مفتوح';
      case 'in_progress': return 'قيد المتابعة';
      case 'resolved': return 'تم الحل';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  const getDaysUntilFollowUp = (followUpDate?: string) => {
    if (!followUpDate) return null;
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">تتبع الطلاب</h1>
          <p className="text-slate-500 dark:text-slate-400">متابعة شاملة لتقدم الطلاب الأكاديمي والسلوكي والاجتماعي</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          إضافة متابعة جديدة
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي المتابعات', value: trackingEntries.length, icon: 'assignment', color: 'bg-blue-500' },
          { label: 'قيد المتابعة', value: trackingEntries.filter(e => e.status === 'in_progress').length, icon: 'pending', color: 'bg-yellow-500' },
          { label: 'تم الحل', value: trackingEntries.filter(e => e.status === 'resolved').length, icon: 'check_circle', color: 'bg-green-500' },
          { label: 'عاجلة', value: trackingEntries.filter(e => e.priority === 'urgent').length, icon: 'priority_high', color: 'bg-red-500' }
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
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع المتابعة</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">جميع الأنواع</option>
              <option value="academic">أكاديمي</option>
              <option value="behavioral">سلوكي</option>
              <option value="social">اجتماعي</option>
              <option value="attendance">حضور</option>
              <option value="health">صحي</option>
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
              <option value="open">مفتوح</option>
              <option value="in_progress">قيد المتابعة</option>
              <option value="resolved">تم الحل</option>
              <option value="closed">مغلق</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الأولوية</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">جميع الأولويات</option>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tracking Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => {
          const daysUntilFollowUp = getDaysUntilFollowUp(entry.followUpDate);
          const isFollowUpDue = daysUntilFollowUp !== null && daysUntilFollowUp <= 0;
          
          return (
            <div 
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                entry.priority === 'urgent' ? 'border-red-200 dark:border-red-800/50' :
                isFollowUpDue ? 'border-orange-200 dark:border-orange-800/50' :
                'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Student Avatar */}
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 font-bold flex-shrink-0">
                  {entry.studentAvatar ? (
                    <img src={entry.studentAvatar} alt={entry.studentName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    entry.studentName.charAt(0)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{entry.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{entry.studentName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getPriorityColor(entry.priority)}`}>
                        {getPriorityText(entry.priority)}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(entry.status)}`}>
                        {getStatusText(entry.status)}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {entry.details}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${getTypeColor(entry.trackingType)}`}>
                          <span className="material-symbols-outlined text-sm">{getTypeIcon(entry.trackingType)}</span>
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{getTypeText(entry.trackingType)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>{new Date(entry.trackingDate).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>

                    {entry.followUpDate && (
                      <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                        isFollowUpDue ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                        'text-slate-500 dark:text-slate-400'
                      }`}>
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>
                          {isFollowUpDue ? 'متابعة مستحقة' : 
                           daysUntilFollowUp === 1 ? 'متابعة غداً' :
                           `متابعة خلال ${daysUntilFollowUp} أيام`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">person_search</span>
          <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">لا توجد متابعات</h3>
          <p className="text-slate-400">لا توجد متابعات تطابق المعايير المحددة</p>
        </div>
      )}

      {/* Entry Details Modal */}
      {selectedEntry && (
        <Modal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} title="تفاصيل المتابعة">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 font-bold text-xl">
                {selectedEntry.studentAvatar ? (
                  <img src={selectedEntry.studentAvatar} alt={selectedEntry.studentName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  selectedEntry.studentName.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedEntry.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-3">{selectedEntry.studentName}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getTypeColor(selectedEntry.trackingType)}`}>
                    {getTypeText(selectedEntry.trackingType)}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getPriorityColor(selectedEntry.priority)}`}>
                    {getPriorityText(selectedEntry.priority)}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(selectedEntry.status)}`}>
                    {getStatusText(selectedEntry.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-3">تفاصيل المتابعة</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                {selectedEntry.details}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ المتابعة</h5>
                <p className="text-slate-900 dark:text-white">{new Date(selectedEntry.trackingDate).toLocaleDateString('ar-EG')}</p>
              </div>
              {selectedEntry.followUpDate && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ المتابعة القادمة</h5>
                  <p className="text-slate-900 dark:text-white">{new Date(selectedEntry.followUpDate).toLocaleDateString('ar-EG')}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedEntry.notes && (
              <div>
                <h5 className="font-bold text-slate-800 dark:text-white mb-3">ملاحظات إضافية</h5>
                <p className="text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30">
                  {selectedEntry.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold">
                تحديث المتابعة
              </button>
              <button className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                إضافة ملاحظة
              </button>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Tracking Modal */}
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة متابعة جديدة">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الطالب</label>
                <input 
                  type="text" 
                  placeholder="ابحث عن الطالب..."
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع المتابعة</label>
                <select className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="academic">أكاديمي</option>
                  <option value="behavioral">سلوكي</option>
                  <option value="social">اجتماعي</option>
                  <option value="attendance">حضور</option>
                  <option value="health">صحي</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">عنوان المتابعة</label>
              <input 
                type="text" 
                placeholder="مثال: انخفاض في الدرجات"
                className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">التفاصيل</label>
              <textarea 
                placeholder="اكتب تفاصيل المتابعة..."
                className="w-full h-32 py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الأولوية</label>
                <select className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ المتابعة القادمة</label>
                <input 
                  type="date" 
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
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
                حفظ المتابعة
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentTracking;