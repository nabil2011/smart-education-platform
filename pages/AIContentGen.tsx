import React, { useState } from 'react';

interface SavedContent {
  id: number;
  type: string;
  topic: string;
  content: string;
  date: string;
}

const AIContentGen: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('خطة درس');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedContent[]>([]);

  const handleGenerate = () => {
    setIsLoading(true);
    setResult(null);
    // Simulate AI delay
    setTimeout(() => {
      let generatedText = '';
      if (contentType === 'خطة درس') {
        generatedText = `إليك خطة درس مقترحة عن "${topic}":\n\n1. المقدمة (5 دقائق):\n   - طرح سؤال مثير للتفكير.\n   - عرض صور توضيحية.\n\n2. الشرح (15 دقيقة):\n   - تعريف المفاهيم الأساسية.\n   - أمثلة من الواقع.\n\n3. النشاط التفاعلي (10 دقائق):\n   - تقسيم الطلاب لمجموعات.\n   - حل ورقة عمل.\n\n4. التقييم (5 دقائق):\n   - اختبار قصير سريع.`;
      } else if (contentType === 'اختبار') {
        generatedText = `اختبار قصير عن "${topic}":\n\nس1: عرف المفهوم التالي باختصار.\n...................................\n\nس2: اختر الإجابة الصحيحة مما يلي:\n (أ) خيار أول  (ب) خيار ثاني\n\nس3: صح أم خطأ؟\n...................................`;
      } else {
        generatedText = `قصة قصيرة عن "${topic}":\n\nفي يوم من الأيام، كان هناك بطل صغير يدعى "أحمد"، قرر أن يستكشف عالم ${topic}. حمل حقيبته وانطلق في رحلة مليئة بالمغامرات...`;
      }
      setResult(generatedText);
      setIsLoading(false);
    }, 2000);
  };

  const handleSave = () => {
    if (!result) return;
    const newItem: SavedContent = {
      id: Date.now(),
      type: contentType,
      topic: topic,
      content: result,
      date: new Date().toLocaleDateString('ar-EG')
    };
    setSavedItems([newItem, ...savedItems]);
    alert("تم الحفظ في المكتبة بنجاح!");
  };

  return (
    <div className="max-w-6xl mx-auto py-6 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
          <span className="material-symbols-outlined text-white text-3xl">auto_awesome</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">منشئ المحتوى الذكي</h1>
        <p className="text-slate-500 dark:text-slate-400">استخدم الذكاء الاصطناعي لإنشاء خطط دروس، اختبارات، وأنشطة في ثوانٍ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
        {/* Input Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">نوع المحتوى</label>
              <div className="grid grid-cols-3 gap-2">
                {['خطة درس', 'اختبار', 'قصة قصيرة'].map((type) => (
                  <button 
                    key={type} 
                    onClick={() => setContentType(type)}
                    className={`border rounded-lg py-2 text-sm font-medium transition-all
                      ${contentType === type 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 ring-1 ring-primary-500' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'}
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الموضوع</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="مثال: شرح الجملة الفعلية للصف الرابع..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 min-h-[120px] p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              ></textarea>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المرحلة الدراسية</label>
                <select className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-2.5 outline-none focus:ring-2 focus:ring-primary-500">
                  <option>الصف الأول</option>
                  <option>الصف الثاني</option>
                  <option>الصف الثالث</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">مستوى الصعوبة</label>
                <select className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 p-2.5 outline-none focus:ring-2 focus:ring-primary-500">
                  <option>سهل</option>
                  <option>متوسط</option>
                  <option>متقدم</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || !topic}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined">auto_awesome</span>
              )}
              {isLoading ? 'جاري التوليد...' : 'توليد المحتوى'}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-3xl -z-10 rounded-full"></div>
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px] transition-all duration-500 flex flex-col ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            {!result && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">description</span>
                <p>ستظهر النتيجة هنا</p>
              </div>
            )}
            
            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="size-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 animate-pulse">الذكاء الاصطناعي يفكر...</p>
              </div>
            )}

            {result && !isLoading && (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white m-0">النتيجة المقترحة</h3>
                    <span className="text-xs text-slate-500">{contentType}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="نسخ">
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-primary-600" title="حفظ في المكتبة"
                    >
                      <span className="material-symbols-outlined text-sm">bookmark_add</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed overflow-y-auto max-h-[400px]">
                  {result}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Library Section */}
      {savedItems.length > 0 && (
        <div className="animate-slide-up border-t border-slate-200 dark:border-slate-800 pt-8">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary-500">library_books</span>
             مكتبة المحتوى المحفوظ
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {savedItems.map((item) => (
               <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">{item.type}</span>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">{item.topic}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{item.content}</p>
                  <div className="flex justify-end">
                    <button className="text-primary-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      عرض كامل <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default AIContentGen;