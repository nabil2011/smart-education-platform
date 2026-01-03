import React, { useState } from 'react';
import Modal from '../components/Modal';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  type: 'homework' | 'project' | 'quiz' | 'essay';
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  maxScore: number;
  description: string;
  attachments?: string[];
}

const mockAssignments: Assignment[] = [
  {
    id: 1,
    title: 'حل تمارين الرياضيات - الوحدة الثالثة',
    subject: 'رياضيات',
    type: 'homework',
    dueDate: '2024-01-15',
    status: 'pending',
    maxScore: 20,
    description: 'حل جميع التمارين من صفحة 45 إلى 52 في كتاب الرياضيات',
    attachments: ['تمارين_الوحدة_الثالثة.pdf']
  },
  {
    id: 2,
    title: 'مشروع عن دورة الماء في الطبيعة',
    subject: 'علوم',
    type: 'project',
    dueDate: '2024-01-20',
    status: 'submitted',
    score: 18,
    maxScore: 20,
    description: 'إعداد مشروع تفاعلي يوضح مراحل دورة الماء مع الرسوم التوضيحية',
    attachments: ['مشروع_دورة_الماء.pptx', 'صور_توضيحية.zip']
  },
  {
    id: 3,
    title: 'اختبار قصير في النحو',
    subject: 'لغة عربية',
    type: 'quiz',
    dueDate: '2024-01-12',
    status: 'graded',
    score: 15,
    maxScore: 20,
    description: 'اختبار يغطي موضوعات الفاعل والمفعول به',
  },
  {
    id: 4,
    title: 'كتابة موضوع تعبير عن الوطن',
    subject: 'لغة عربية',
    type: 'essay',
    dueDate: '2024-01-10',
    status: 'overdue',
    maxScore: 15,
    description: 'كتابة موضوع تعبير لا يقل عن 200 كلمة عن حب الوطن',
  }
];

const Assignments: React.FC = () => {
  const [assignments] = useState<Assignment[]>(mockAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'overdue'>('all');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');

  const filteredAssignments = assignments.filter(assignment => 
    filter === 'all' || assignment.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'graded': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'submitted': return 'تم التسليم';
      case 'graded': return 'تم التصحيح';
      case 'overdue': return 'متأخر';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'homework': return 'menu_book';
      case 'project': return 'assignment';
      case 'quiz': return 'quiz';
      case 'essay': return 'edit_note';
      default: return 'assignment';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'homework': return 'واجب منزلي';
      case 'project': return 'مشروع';
      case 'quiz': return 'اختبار قصير';
      case 'essay': return 'موضوع تعبير';
      default: return type;
    }
  };

  const handleSubmitAssignment = () => {
    if (selectedAssignment && submissionText.trim()) {
      // Here you would typically send the submission to the backend
      alert('تم تسليم الواجب بنجاح!');
      setIsSubmissionModalOpen(false);
      setSubmissionText('');
      setSelectedAssignment(null);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الواجبات والمهام</h1>
          <p className="text-slate-500 dark:text-slate-400">تتبع واجباتك ومشاريعك الدراسية</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'all', label: 'الكل', count: assignments.length },
            { id: 'pending', label: 'قيد الانتظار', count: assignments.filter(a => a.status === 'pending').length },
            { id: 'submitted', label: 'تم التسليم', count: assignments.filter(a => a.status === 'submitted').length },
            { id: 'graded', label: 'تم التصحيح', count: assignments.filter(a => a.status === 'graded').length },
            { id: 'overdue', label: 'متأخر', count: assignments.filter(a => a.status === 'overdue').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === tab.id 
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => {
          const daysUntilDue = getDaysUntilDue(assignment.dueDate);
          const isUrgent = daysUntilDue <= 2 && daysUntilDue >= 0;
          
          return (
            <div 
              key={assignment.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                assignment.status === 'overdue' 
                  ? 'border-red-200 dark:border-red-800/50' 
                  : isUrgent 
                    ? 'border-orange-200 dark:border-orange-800/50'
                    : 'border-slate-200 dark:border-slate-800'
              }`}
              onClick={() => setSelectedAssignment(assignment)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    assignment.type === 'homework' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' :
                    assignment.type === 'project' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' :
                    assignment.type === 'quiz' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                    'bg-orange-100 dark:bg-orange-900/20 text-orange-600'
                  }`}>
                    <span className="material-symbols-outlined text-lg">{getTypeIcon(assignment.type)}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{assignment.subject}</span>
                    <p className="text-xs text-slate-400">{getTypeText(assignment.type)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(assignment.status)}`}>
                  {getStatusText(assignment.status)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {assignment.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                {assignment.description}
              </p>

              {/* Due Date & Score */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-slate-400">schedule</span>
                  <span className={`${
                    assignment.status === 'overdue' ? 'text-red-600 font-bold' :
                    isUrgent ? 'text-orange-600 font-bold' :
                    'text-slate-600 dark:text-slate-400'
                  }`}>
                    {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                  </span>
                  {assignment.status === 'pending' && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      assignment.status === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                      isUrgent ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800'
                    }`}>
                      {assignment.status === 'overdue' ? `متأخر ${Math.abs(daysUntilDue)} يوم` :
                       daysUntilDue === 0 ? 'اليوم' :
                       daysUntilDue === 1 ? 'غداً' :
                       `${daysUntilDue} أيام`}
                    </span>
                  )}
                </div>
                {assignment.score !== undefined && (
                  <div className="text-sm font-bold">
                    <span className={`${
                      (assignment.score / assignment.maxScore) >= 0.8 ? 'text-green-600' :
                      (assignment.score / assignment.maxScore) >= 0.6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {assignment.score}
                    </span>
                    <span className="text-slate-400">/{assignment.maxScore}</span>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span className="material-symbols-outlined text-sm">attach_file</span>
                  <span>{assignment.attachments.length} مرفق</span>
                </div>
              )}

              {/* Action Button */}
              {assignment.status === 'pending' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAssignment(assignment);
                    setIsSubmissionModalOpen(true);
                  }}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">upload</span>
                  تسليم الواجب
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">assignment</span>
          <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">لا توجد واجبات</h3>
          <p className="text-slate-400">لا توجد واجبات في هذا التصنيف حالياً</p>
        </div>
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && !isSubmissionModalOpen && (
        <Modal isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} title="تفاصيل الواجب">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                selectedAssignment.type === 'homework' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' :
                selectedAssignment.type === 'project' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' :
                selectedAssignment.type === 'quiz' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                'bg-orange-100 dark:bg-orange-900/20 text-orange-600'
              }`}>
                <span className="material-symbols-outlined text-2xl">{getTypeIcon(selectedAssignment.type)}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedAssignment.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>{selectedAssignment.subject}</span>
                  <span>•</span>
                  <span>{getTypeText(selectedAssignment.type)}</span>
                  <span>•</span>
                  <span className={getStatusColor(selectedAssignment.status) + ' px-2 py-1 rounded'}>
                    {getStatusText(selectedAssignment.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">وصف الواجب</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedAssignment.description}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">تاريخ التسليم</h5>
                <p className="text-slate-900 dark:text-white">{new Date(selectedAssignment.dueDate).toLocaleDateString('ar-EG')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">الدرجة الكاملة</h5>
                <p className="text-slate-900 dark:text-white">{selectedAssignment.maxScore} نقطة</p>
              </div>
            </div>

            {/* Score (if graded) */}
            {selectedAssignment.score !== undefined && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-4 rounded-xl">
                <h5 className="font-bold text-green-800 dark:text-green-400 mb-2">النتيجة</h5>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-green-600">
                    {selectedAssignment.score}/{selectedAssignment.maxScore}
                  </span>
                  <span className="text-green-600">
                    ({Math.round((selectedAssignment.score / selectedAssignment.maxScore) * 100)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
              <div>
                <h5 className="font-bold text-slate-800 dark:text-white mb-3">المرفقات</h5>
                <div className="space-y-2">
                  {selectedAssignment.attachments.map((attachment, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="material-symbols-outlined text-slate-500">attach_file</span>
                      <span className="flex-1 text-slate-700 dark:text-slate-300">{attachment}</span>
                      <button className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 p-1 rounded">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {selectedAssignment.status === 'pending' && (
                <button 
                  onClick={() => setIsSubmissionModalOpen(true)}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">upload</span>
                  تسليم الواجب
                </button>
              )}
              <button 
                onClick={() => setSelectedAssignment(null)}
                className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Submission Modal */}
      {isSubmissionModalOpen && selectedAssignment && (
        <Modal isOpen={isSubmissionModalOpen} onClose={() => setIsSubmissionModalOpen(false)} title="تسليم الواجب">
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{selectedAssignment.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedAssignment.subject} • {getTypeText(selectedAssignment.type)}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">إجابتك</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="اكتب إجابتك هنا..."
                className="w-full h-40 p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">إرفاق ملفات (اختياري)</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">cloud_upload</span>
                <p className="text-slate-500 dark:text-slate-400 mb-2">اسحب الملفات هنا أو انقر للاختيار</p>
                <button className="text-primary-600 font-bold text-sm">اختيار ملفات</button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setIsSubmissionModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSubmitAssignment}
                disabled={!submissionText.trim()}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">send</span>
                تسليم
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Assignments;