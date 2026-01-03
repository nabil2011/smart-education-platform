import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types
interface Lesson {
  id: number;
  title: string;
  subject: string;
  duration: string;
  progress: number;
  thumbnail: string;
  videoUrl: string;
  description: string;
  color: string;
}

interface Task {
  id: number;
  title: string;
  date: string;
  type: 'homework' | 'quiz' | 'project';
  completed: boolean;
}

// Mock Data
const lessonsList: Lesson[] = [
  {
    id: 1,
    title: 'أنواع الخبر في الجملة الاسمية',
    subject: 'نحو',
    duration: '15:00',
    progress: 40,
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4F2t55A_wJTMREd9JSUpHo-adct3cTzeLUTzX_67gmWcFYQWhOkL_CoIXlBl8Mhy_QZ1TwzEEfYTsyp5qJpQF2imdRmyapUfVr0fV79P4hUx9S3uPfvugGhFvUdWvPkqu8zFpSKFpFKmK3SnvneQK7WYjLTxCDvAW6Z44cePVGjtnoeX9BQAus-gZzRv-05a0TF8kh19i4sV0f11pMVoQre6RLHbWIQ9dbMIETHMky5mQ46LfXEzMQMy4oIeU1Q5h887_b5UTpyo',
    videoUrl: 'https://www.youtube.com/embed/C28f7X3l-90', // Valid Grammar/Arabic related video
    description: 'سنتعلم اليوم كيفية تحديد أنواع الخبر المختلفة: المفرد، والجملة، وشبه الجملة، مع أمثلة تطبيقية.',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
  },
  {
    id: 2,
    title: 'الكسور العشرية والعمليات عليها',
    subject: 'رياضيات',
    duration: '22:00',
    progress: 0,
    thumbnail: 'https://img.freepik.com/free-vector/math-background_23-2148146270.jpg',
    videoUrl: 'https://www.youtube.com/embed/5K1-D5K2-t0', // Valid Math video
    description: 'شرح مبسط لطريقة جمع وطرح وضرب الكسور العشرية مع حل مسائل حياتية.',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
  },
  {
    id: 3,
    title: 'دورة حياة النبات',
    subject: 'علوم',
    duration: '18:00',
    progress: 10,
    thumbnail: 'https://img.freepik.com/free-vector/hand-drawn-photosynthesis-infographic_23-2149028703.jpg',
    videoUrl: 'https://www.youtube.com/embed/w77zPAtVTuI', // Plant timelapse
    description: 'رحلة ممتعة داخل عالم النباتات للتعرف على مراحل النمو من البذرة إلى الثمرة.',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
  },
  {
    id: 4,
    title: 'تاريخ الأندلس',
    subject: 'تاريخ',
    duration: '25:00',
    progress: 0,
    thumbnail: 'https://img.freepik.com/free-vector/ancient-rome-flat-composition_1284-73238.jpg',
    videoUrl: 'https://www.youtube.com/embed/p1pXyH-8r_w', // History placeholder
    description: 'نظرة عامة على العصر الذهبي للأندلس وأهم المعالم الحضارية.',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'
  }
];

const initialTasks: Task[] = [
  { id: 1, title: 'حل تمارين الرياضيات صـ 45', date: 'غداً', type: 'homework', completed: false },
  { id: 2, title: 'اختبار نحو قصير', date: 'الخميس', type: 'quiz', completed: false },
  { id: 3, title: 'تسليم مشروع العلوم', date: 'الأحد القادم', type: 'project', completed: false },
  { id: 4, title: 'قراءة قصة "الأيام"', date: 'الأسبوع القادم', type: 'homework', completed: true },
];

const chartData = [
  { name: 'الأحد', score: 65 },
  { name: 'الاثنين', score: 75 },
  { name: 'الثلاثاء', score: 68 },
  { name: 'الأربعاء', score: 85 },
  { name: 'الخميس', score: 82 },
  { name: 'الجمعة', score: 90 },
  { name: 'السبت', score: 95 },
];

const StudentDashboard: React.FC = () => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  
  // Tasks State
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskFilter, setTaskFilter] = useState<'pending' | 'completed'>('pending');

  const categories = ['الكل', 'نحو', 'رياضيات', 'علوم', 'تاريخ'];

  const filteredLessons = selectedCategory === 'الكل' 
    ? lessonsList 
    : lessonsList.filter(l => l.subject === selectedCategory);

  const handleLessonStart = (lesson: Lesson) => {
    setActiveLesson(lesson);
  };

  const closePlayer = () => {
    setActiveLesson(null);
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const filteredTasks = tasks.filter(t => taskFilter === 'pending' ? !t.completed : t.completed);

  const getTaskIcon = (type: string) => {
    switch(type) {
      case 'homework': return { icon: 'menu_book', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
      case 'quiz': return { icon: 'quiz', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
      case 'project': return { icon: 'group', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' };
      default: return { icon: 'task', color: 'text-slate-500 bg-slate-50' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Video Player Overlay */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeLesson.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${activeLesson.color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                  {activeLesson.subject}
                </span>
              </div>
              <button onClick={closePlayer} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="relative pt-[56.25%] bg-black">
              <iframe 
                src={`${activeLesson.videoUrl}?rel=0&modestbranding=1`}
                className="absolute inset-0 w-full h-full"
                title={activeLesson.title}
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-6 overflow-y-auto">
               <h4 className="font-bold text-slate-800 dark:text-white mb-2">وصف الدرس</h4>
               <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                 {activeLesson.description}
               </p>
               
               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                 <div className="flex items-center gap-3">
                   <div className="size-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                     <span className="material-symbols-outlined">quiz</span>
                   </div>
                   <div>
                     <p className="font-bold text-slate-800 dark:text-white text-sm">اختبار قصير</p>
                     <p className="text-xs text-slate-500">اختبر فهمك لهذا الدرس</p>
                   </div>
                 </div>
                 <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-bold transition-colors">
                   بدء الاختبار
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">مرحباً يا أحمد! 👋 <br/> أنت في طريقك للتميز</h1>
          <p className="text-primary-100 text-lg mb-6">لقد أكملت 75% من هدفك الأسبوعي. استمر في العمل الرائع!</p>
          <button 
            onClick={() => handleLessonStart(lessonsList[0])}
            className="bg-white text-primary-700 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-lg flex items-center gap-2"
          >
            <span className="material-symbols-outlined">play_circle</span>
            متابعة التعلم
          </button>
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm text-primary-100">درس مكتمل</p>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <p className="text-3xl font-bold">850</p>
            <p className="text-sm text-primary-100">نقطة</p>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
           </svg>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Lesson Card */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Lesson Display */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary-500">play_circle</span>
                الدرس التالي
            </h2>
            <div 
                onClick={() => handleLessonStart(lessonsList[0])}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6 items-center cursor-pointer group hover:border-primary-500 transition-all"
            >
                <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden">
                <img src={lessonsList[0].thumbnail} alt="Lesson" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <span className="material-symbols-outlined text-white text-4xl bg-white/20 rounded-full p-2 backdrop-blur-sm group-hover:scale-110 transition-transform">play_arrow</span>
                </div>
                </div>
                <div className="flex-1 text-center sm:text-right w-full">
                <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${lessonsList[0].color}`}>
                    {lessonsList[0].subject}
                    </span>
                    <span className="text-slate-400 text-sm">• {lessonsList[0].duration} دقيقة</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-500 transition-colors">{lessonsList[0].title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{lessonsList[0].description}</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-1">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${lessonsList[0].progress}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 text-left">{lessonsList[0].progress}% مكتمل</p>
                </div>
            </div>
          </div>

          {/* Lesson Library (Horizontal Scroll) */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">مكتبة الدروس</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
                      ${selectedCategory === cat 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredLessons.map((lesson) => (
                 <div 
                   key={lesson.id}
                   onClick={() => handleLessonStart(lesson)}
                   className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
                 >
                    <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                      <img src={lesson.thumbnail} alt={lesson.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
                        {lesson.duration}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                         <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">play_circle</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${lesson.color}`}>
                         {lesson.subject}
                       </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-2">{lesson.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                       <span className="material-symbols-outlined text-sm">visibility</span>
                       <span>240 مشاهدة</span>
                    </div>
                 </div>
              ))}
              {/* Extra Mock Card for layout */}
               <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-primary-500 hover:border-primary-300 transition-all cursor-pointer min-h-[220px]">
                  <span className="material-symbols-outlined text-3xl mb-2">add_circle</span>
                  <span className="font-bold text-sm">استكشف المزيد</span>
               </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">أداؤك هذا الأسبوع</h3>
              <select className="bg-slate-50 dark:bg-slate-800 border-none text-sm rounded-lg py-1 px-3">
                <option>آخر 7 أيام</option>
                <option>آخر شهر</option>
              </select>
            </div>
            <div className="h-[250px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Progress Circle */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">المستوى الحالي</h3>
            <div className="relative size-40 mx-auto mb-4">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-primary-500 drop-shadow-lg" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white">4</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">المستوى</span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">أنت في أعلى 10% من فصلك!</p>
          </div>

          {/* Interactive Upcoming Tasks */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">المهام والواجبات</h3>
               <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs font-bold">
                 {tasks.filter(t => !t.completed).length} متبقي
               </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
              <button 
                onClick={() => setTaskFilter('pending')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${taskFilter === 'pending' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}
              >
                قيد الانتظار
              </button>
              <button 
                onClick={() => setTaskFilter('completed')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${taskFilter === 'completed' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500'}`}
              >
                مكتملة
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const style = getTaskIcon(task.type);
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                        task.completed 
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          task.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600 hover:border-primary-500'
                        }`}
                      >
                        {task.completed && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                      
                      <div className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between mb-0.5">
                           <p className={`font-bold text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</p>
                           {task.date === 'غداً' && !task.completed && (
                             <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">غداً</span>
                           )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                           <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${style.color} bg-opacity-20`}>
                             <span className="material-symbols-outlined text-[14px]">{style.icon}</span>
                             <span>{task.type === 'homework' ? 'واجب' : task.type === 'quiz' ? 'اختبار' : 'مشروع'}</span>
                           </div>
                           <span>• {task.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">task_alt</span>
                  <p className="text-sm">لا توجد مهام {taskFilter === 'pending' ? 'قيد الانتظار' : 'مكتملة'}!</p>
                </div>
              )}
            </div>
            
            {taskFilter === 'pending' && filteredTasks.length > 0 && (
              <button className="w-full mt-4 text-primary-600 text-xs font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span>
                إضافة مهمة شخصية
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;