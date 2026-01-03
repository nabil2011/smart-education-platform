import React, { useState, useEffect, useRef } from 'react';

// Types
type Category = 'quran' | 'arabic' | 'english';
type Level = 'beginner' | 'intermediate' | 'advanced';

interface Challenge {
  id: number;
  category: Category;
  level: Level;
  title: string;
  text: string;
  transliteration?: string; // For English or difficult Arabic
  tips: string;
}

interface WordResult {
  word: string;
  score: number; // 0-100
  feedback?: string;
}

// Mock Data Library
const challenges: Challenge[] = [
  // Quran
  {
    id: 1,
    category: 'quran',
    level: 'beginner',
    title: 'سورة الفاتحة - الآية 2',
    text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    tips: 'ركز على كسر اللام في "لِلَّهِ" وإظهار العين في "الْعَالَمِينَ".'
  },
  {
    id: 2,
    category: 'quran',
    level: 'intermediate',
    title: 'سورة الإخلاص',
    text: 'قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ الصَّمَدُ',
    tips: 'انتبه للقلقلة في حرف الدال عند الوقف.'
  },
  // Arabic Literature
  {
    id: 3,
    category: 'arabic',
    level: 'intermediate',
    title: 'شعر للمتنبي',
    text: 'الخَيْلُ وَاللّيْلُ وَالبَيْداءُ تَعرِفُني',
    tips: 'حاول إظهار فخامة حرف الخاء والمد في "البيداء".'
  },
  {
    id: 4,
    category: 'arabic',
    level: 'beginner',
    title: 'جملة مفيدة',
    text: 'العِلْمُ نُورٌ يَبْني المُسْتَقبلَ',
    tips: 'اضبط حركات التشكيل في أواخر الكلمات.'
  },
  // English
  {
    id: 5,
    category: 'english',
    level: 'beginner',
    title: 'Greeting',
    text: 'The quick brown fox jumps over the lazy dog.',
    transliteration: 'ذا كويك براون فوكس...',
    tips: 'Focus on the "th" sound in "The" and "v" in "over".'
  },
  {
    id: 6,
    category: 'english',
    level: 'advanced',
    title: 'Tongue Twister',
    text: 'She sells seashells by the seashore.',
    tips: 'Differentiate clearly between "sh" and "s" sounds.'
  }
];

const Pronunciation: React.FC = () => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<Category>('arabic');
  const [selectedLevel, setSelectedLevel] = useState<Level>('beginner');
  const [activeChallenge, setActiveChallenge] = useState<Challenge>(challenges[3]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(15).fill(10));
  const [result, setResult] = useState<{ totalScore: number; words: WordResult[] } | null>(null);

  // Filter List
  const filteredList = challenges.filter(c => c.category === selectedCategory && c.level === selectedLevel);

  // Simulate Audio Visualizer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioLevel(prev => prev.map(() => Math.random() * 80 + 20));
      }, 80);
    } else {
      setAudioLevel(new Array(15).fill(10));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleChallengeSelect = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    setResult(null);
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop & Process
      setIsRecording(false);
      setIsProcessing(true);
      
      // Simulate API Analysis
      setTimeout(() => {
        setIsProcessing(false);
        const words = activeChallenge.text.split(' ');
        const mockResults: WordResult[] = words.map(word => {
          const score = Math.random() > 0.3 ? 100 : Math.floor(Math.random() * 40 + 40);
          return {
            word,
            score,
            feedback: score < 90 ? 'مخرج الحرف غير واضح' : undefined
          };
        });
        
        const totalScore = Math.floor(mockResults.reduce((acc, curr) => acc + curr.score, 0) / words.length);
        setResult({ totalScore, words: mockResults });
      }, 2000);

    } else {
      // Start
      setResult(null);
      setIsRecording(true);
    }
  };

  const playReferenceAudio = () => {
    // Placeholder for text-to-speech or pre-recorded audio
    alert(`جاري تشغيل النطق الصحيح لـ: "${activeChallenge.text}"`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">مصحح النطق الذكي</h1>
          <p className="text-slate-500 dark:text-slate-400">حسن مهاراتك في التلاوة، الإلقاء، واللغات الأجنبية.</p>
        </div>
        
        {/* Category Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'quran', label: 'القرآن الكريم', icon: 'menu_book' },
            { id: 'arabic', label: 'اللغة العربية', icon: 'translate' },
            { id: 'english', label: 'English', icon: 'language' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id as Category); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar: Library */}
        <div className="lg:w-1/3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">المستوى</label>
             <div className="flex gap-2">
                {['beginner', 'intermediate', 'advanced'].map(lvl => (
                  <button 
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl as Level)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      selectedLevel === lvl 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 text-primary-700' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {lvl === 'beginner' ? 'مبتدأ' : lvl === 'intermediate' ? 'متوسط' : 'متقدم'}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredList.length > 0 ? (
              filteredList.map(item => (
                <div 
                  key={item.id}
                  onClick={() => handleChallengeSelect(item)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    activeChallenge.id === item.id 
                      ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <h4 className={`font-bold text-sm mb-1 ${activeChallenge.id === item.id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                    {item.title}
                  </h4>
                  <p className={`text-xs truncate ${activeChallenge.id === item.id ? 'text-primary-100' : 'text-slate-500'}`} dir="auto">
                    {item.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                <p>لا توجد نصوص متاحة لهذا المستوى</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Stage: Practice Area */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          {/* Active Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center flex-1 relative overflow-hidden">
            
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-primary-500/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex gap-2 absolute top-6 right-6">
              <button 
                onClick={playReferenceAudio}
                className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-500 hover:text-white transition-colors flex items-center justify-center"
                title="استمع للنطق الصحيح"
              >
                <span className="material-symbols-outlined">volume_up</span>
              </button>
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold mb-8">
              {activeChallenge.category === 'quran' ? 'تلاوة' : activeChallenge.category === 'english' ? 'Speaking' : 'قراءة'}
            </span>

            {/* The Text */}
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-800 dark:text-slate-100 leading-relaxed text-center mb-4" dir={activeChallenge.category === 'english' ? 'ltr' : 'rtl'}>
              {result ? (
                // Render Colored Result
                result.words.map((w, i) => (
                  <span key={i} className={`inline-block mx-1.5 px-1 rounded transition-colors ${
                    w.score >= 90 ? 'text-green-600 dark:text-green-400' : 
                    w.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    {w.word}
                  </span>
                ))
              ) : (
                // Render Plain Text
                activeChallenge.text
              )}
            </h2>

            {/* Tips or Transliteration */}
            {!result && (
              <p className="text-slate-500 dark:text-slate-400 text-center text-lg max-w-lg mb-8">
                {activeChallenge.transliteration || activeChallenge.tips}
              </p>
            )}

            {/* Action Buttons & Visualizer */}
            <div className="mt-auto w-full flex flex-col items-center gap-6">
               {/* Visualizer */}
               <div className="h-16 flex items-center gap-1.5 justify-center w-full max-w-xs">
                {audioLevel.map((height, i) => (
                  <div 
                    key={i}
                    className={`w-2 rounded-full transition-all duration-75 ${
                      isRecording ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    style={{ height: isRecording ? `${height}%` : '20%' }}
                  ></div>
                ))}
              </div>

              {!isProcessing ? (
                <button 
                  onClick={toggleRecording}
                  className={`size-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-xl ${
                    isRecording 
                      ? 'bg-red-500 text-white shadow-red-500/40 animate-pulse' 
                      : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-primary-500/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-4xl">
                    {isRecording ? 'stop' : 'mic'}
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center">
                   <div className="size-16 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin mb-3"></div>
                   <span className="text-sm text-slate-500 font-medium animate-pulse">جاري تحليل الصوت...</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Result Feedback (Only show after processing) */}
          {result && (
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 animate-slide-up flex flex-col md:flex-row gap-6 items-center">
                <div className="flex flex-col items-center justify-center min-w-[150px]">
                   <div className={`text-5xl font-black mb-1 ${
                     result.totalScore >= 90 ? 'text-green-500' : 
                     result.totalScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                   }`}>
                     {result.totalScore}%
                   </div>
                   <span className="text-xs font-bold text-slate-400 uppercase">الدقة العامة</span>
                </div>
                
                <div className="flex-1 w-full">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3">نقاط التحسين:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {result.words.filter(w => w.score < 90).length > 0 ? (
                      result.words.filter(w => w.score < 90).map((w, i) => (
                        <div key={i} className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                           <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
                           <div className="text-sm">
                             <span className="font-bold text-slate-800 dark:text-white mx-1">"{w.word}"</span>
                             <span className="text-slate-600 dark:text-slate-300">- {w.feedback || 'حاول تحسين نطق هذه الكلمة'}</span>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 p-3 rounded-lg">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="font-bold">أداء مذهل! نطقك سليم 100%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                   <button onClick={() => toggleRecording()} className="flex-1 md:flex-none py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-colors text-sm">
                     محاولة أخرى
                   </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pronunciation;