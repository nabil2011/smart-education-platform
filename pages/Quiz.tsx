import React, { useState } from 'react';

// --- Types & Interfaces ---
interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

interface QuizData {
  id: number;
  title: string;
  subject: string;
  grade: string; // 'grade4', 'grade5', 'grade6'
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  duration: number; // in minutes
}

// --- Mock Data ---
const grades = [
  { id: 'grade4', label: 'الصف الرابع' },
  { id: 'grade5', label: 'الصف الخامس' },
  { id: 'grade6', label: 'الصف السادس' },
];

const subjects = [
  { id: 'all', label: 'الكل', icon: 'apps' },
  { id: 'arabic', label: 'لغة عربية', icon: 'menu_book' },
  { id: 'math', label: 'رياضيات', icon: 'calculate' },
  { id: 'science', label: 'علوم', icon: 'science' },
];

const mockQuizzes: QuizData[] = [
  {
    id: 1,
    title: 'أنواع الخبر والمبتدأ',
    subject: 'arabic',
    grade: 'grade5',
    difficulty: 'medium',
    duration: 15,
    questions: [
      { id: 1, question: "ما هو مرادف كلمة \"سعيد\" في الجملة: \"كان الولد سعيداً\"؟", options: ["حزين", "مسرور", "غاضب", "خائف"], correct: 1 },
      { id: 2, question: "حدد نوع الخبر: \"العصفور فوق الشجرة\"", options: ["مفرد", "جملة فعلية", "شبه جملة", "جملة اسمية"], correct: 2 },
      { id: 3, question: "أي الكلمات التالية جمع مذكر سالم؟", options: ["أقلام", "معلمون", "أوقات", "طالبات"], correct: 1 },
    ]
  },
  {
    id: 2,
    title: 'الكسور العشرية',
    subject: 'math',
    grade: 'grade5',
    difficulty: 'hard',
    duration: 20,
    questions: [
      { id: 1, question: "ما ناتج جمع 0.5 + 0.25؟", options: ["0.30", "0.75", "0.80", "1.0"], correct: 1 },
      { id: 2, question: "أي من الكسور التالية أكبر؟", options: ["0.1", "0.01", "0.11", "0.09"], correct: 2 },
    ]
  },
  {
    id: 3,
    title: 'الخلايا النباتية',
    subject: 'science',
    grade: 'grade5',
    difficulty: 'medium',
    duration: 10,
    questions: [
      { id: 1, question: "ما الجزء المسؤول عن البناء الضوئي؟", options: ["النواة", "الجدار الخلوي", "البلاستيدات الخضراء", "السيتوبلازم"], correct: 2 },
    ]
  },
  {
    id: 4,
    title: 'أساسيات النحو',
    subject: 'arabic',
    grade: 'grade4',
    difficulty: 'easy',
    duration: 10,
    questions: [
      { id: 1, question: "كلمة (يكتب) هي فعل:", options: ["ماضٍ", "مضارع", "أمر", "ليس فعلاً"], correct: 1 },
    ]
  }
];

const Quiz: React.FC = () => {
  // State for Dashboard Navigation
  const [viewState, setViewState] = useState<'list' | 'quiz' | 'result'>('list');
  const [selectedGrade, setSelectedGrade] = useState('grade5');
  const [selectedSubject, setSelectedSubject] = useState('all');
  
  // State for Active Quiz
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // --- Filtering Logic ---
  const filteredQuizzes = mockQuizzes.filter(quiz => {
    const gradeMatch = quiz.grade === selectedGrade;
    const subjectMatch = selectedSubject === 'all' || quiz.subject === selectedSubject;
    return gradeMatch && subjectMatch;
  });

  // --- Quiz Logic Handlers ---
  const startQuiz = (quiz: QuizData) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setViewState('quiz');
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const checkAnswer = () => {
    if (!activeQuiz) return;
    setIsAnswered(true);
    if (selectedOption === activeQuiz.questions[currentQuestionIndex].correct) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setViewState('result');
    }
  };

  const resetQuiz = () => {
    setViewState('list');
    setActiveQuiz(null);
  };

  // --- Render Functions ---

  // 1. Dashboard View
  if (viewState === 'list') {
    return (
      <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">مركز الاختبارات</h1>
            <p className="text-slate-500 dark:text-slate-400">اختر اختباراً لتقييم مستواك واكتساب نقاط جديدة</p>
          </div>
          
          {/* Grade Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {grades.map(grade => (
              <button
                key={grade.id}
                onClick={() => setSelectedGrade(grade.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedGrade === grade.id 
                    ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all min-w-fit ${
                selectedSubject === subject.id
                  ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
            >
              <span className="material-symbols-outlined">{subject.icon}</span>
              <span className="font-bold">{subject.label}</span>
            </button>
          ))}
        </div>

        {/* Quiz Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map(quiz => (
              <div 
                key={quiz.id} 
                className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 cursor-pointer flex flex-col justify-between h-full"
                onClick={() => startQuiz(quiz)}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold 
                      ${quiz.subject === 'arabic' ? 'bg-purple-100 text-purple-600' : 
                        quiz.subject === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                    `}>
                      {quiz.subject === 'arabic' ? 'لغة عربية' : quiz.subject === 'math' ? 'رياضيات' : 'علوم'}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-bold
                      ${quiz.difficulty === 'easy' ? 'text-green-500' : quiz.difficulty === 'medium' ? 'text-orange-500' : 'text-red-500'}
                    `}>
                      <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                      {quiz.difficulty === 'easy' ? 'سهل' : quiz.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{quiz.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">help</span>
                      {quiz.questions.length} أسئلة
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">timer</span>
                      {quiz.duration} دقيقة
                    </span>
                  </div>
                </div>
                
                <button className="w-full py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold group-hover:bg-primary-500 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                  <span>ابدأ الاختبار</span>
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 flex flex-col items-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-30">inventory_2</span>
              <p>لا توجد اختبارات متاحة لهذا التصنيف حالياً.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Quiz Active View
  if (viewState === 'quiz' && activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto py-8 animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={resetQuiz} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined">arrow_forward</span>
            <span className="font-bold">خروج</span>
          </button>
          <div className="flex items-center gap-2 text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl">
             <span className="material-symbols-outlined">timer</span>
             <span>{activeQuiz.duration}:00</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-500">السؤال {currentQuestionIndex + 1} من {activeQuiz.questions.length}</span>
            <span className="text-sm font-bold text-primary-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 leading-relaxed text-center">
            {currentQ.question}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((option, index) => {
              let stateClass = "border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800";
              
              if (selectedOption === index) {
                stateClass = "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500";
              }

              if (isAnswered) {
                if (index === currentQ.correct) {
                  stateClass = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
                } else if (selectedOption === index && index !== currentQ.correct) {
                  stateClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
                } else {
                  stateClass = "opacity-50 border-slate-200 dark:border-slate-700";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  className={`w-full p-4 rounded-xl border-2 text-right font-medium transition-all duration-200 flex items-center justify-between ${stateClass}`}
                  disabled={isAnswered}
                >
                  <span>{option}</span>
                  {isAnswered && index === currentQ.correct && (
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                  )}
                  {isAnswered && selectedOption === index && index !== currentQ.correct && (
                    <span className="material-symbols-outlined text-red-500">cancel</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            {!isAnswered ? (
              <button
                onClick={checkAnswer}
                disabled={selectedOption === null}
                className="bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
              >
                تحقق من الإجابة
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>{currentQuestionIndex === activeQuiz.questions.length - 1 ? 'إنهاء الاختبار' : 'السؤال التالي'}</span>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Result View
  if (viewState === 'result' && activeQuiz) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    let feedback = { msg: 'حاول مرة أخرى', color: 'text-red-500', icon: 'mood_bad' };
    if (percentage >= 90) feedback = { msg: 'ممتاز يا بطل!', color: 'text-green-500', icon: 'emoji_events' };
    else if (percentage >= 70) feedback = { msg: 'عمل رائع!', color: 'text-blue-500', icon: 'thumb_up' };
    else if (percentage >= 50) feedback = { msg: 'جيد، لكن يمكنك التحسن', color: 'text-orange-500', icon: 'sentiment_neutral' };

    return (
      <div className="max-w-2xl mx-auto py-12 animate-fade-in flex flex-col items-center text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-xl w-full">
           <div className={`size-24 rounded-full bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-6 ${feedback.color}`}>
             <span className="material-symbols-outlined text-5xl">{feedback.icon}</span>
           </div>
           
           <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{feedback.msg}</h2>
           <p className="text-slate-500 dark:text-slate-400 mb-8">لقد أنهيت اختبار <span className="font-bold text-primary-500">{activeQuiz.title}</span></p>
           
           <div className="flex justify-center items-end gap-2 mb-8">
             <span className="text-6xl font-black text-slate-900 dark:text-white">{percentage}</span>
             <span className="text-2xl font-bold text-slate-400 mb-2">/100</span>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
               <p className="text-xs text-slate-500 mb-1">الإجابات الصحيحة</p>
               <p className="text-xl font-bold text-green-500">{score}</p>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
               <p className="text-xs text-slate-500 mb-1">الإجابات الخاطئة</p>
               <p className="text-xl font-bold text-red-500">{activeQuiz.questions.length - score}</p>
             </div>
           </div>

           <div className="flex gap-4">
             <button 
               onClick={() => startQuiz(activeQuiz)}
               className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
             >
               إعادة المحاولة
             </button>
             <button 
               onClick={resetQuiz}
               className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/20 transition-all"
             >
               قائمة الاختبارات
             </button>
           </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Quiz;