import React from 'react';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col font-body selection:bg-primary-500 selection:text-white overflow-x-hidden">
      {/* Custom Styles for Landing */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        .text-gradient {
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-image: linear-gradient(to right, #13ec5b, #0ea5e9);
        }
        .blob {
          position: absolute;
          filter: blur(80px);
          opacity: 0.4;
          z-index: 0;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .dark .glass-card {
          background: rgba(16, 34, 22, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .grid-bg {
          background-image: radial-gradient(rgba(19, 236, 91, 0.2) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        section {
          scroll-margin-top: 80px;
        }
      `}</style>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#102216]/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <span className="material-symbols-outlined filled-icon">school</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-display tracking-tight">الداعم التعليمي</span>
            </div>
            
            <div className="hidden lg:flex items-center gap-6">
              <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">الميزات</a>
              <a href="#demo" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">كيف يعمل؟</a>
              <a href="#schools" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">للمدارس</a>
              <a href="#pricing" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">الأسعار</a>
              <a href="#about" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">عن المنصة</a>
              <a href="#contact" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">اتصل بنا</a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={onStart}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 whitespace-nowrap"
              >
                دخول / تسجيل
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.03] dark:opacity-[0.05] z-0"></div>
        <div className="blob bg-primary-500/30 w-96 h-96 top-0 left-0 animate-float" style={{animationDelay: '0s'}}></div>
        <div className="blob bg-blue-500/30 w-80 h-80 bottom-0 right-0 animate-float" style={{animationDelay: '2s'}}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 text-primary-700 dark:text-primary-400 font-medium text-sm mb-8 animate-fade-in">
            <span className="flex size-2 rounded-full bg-primary-500 animate-pulse"></span>
            الذكاء الاصطناعي وصل إلى فصلك الدراسي 🚀
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 font-display animate-slide-up">
            حـوّل التعليم إلى <br />
            <span className="text-gradient">تجربة استثنائية</span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{animationDelay: '0.1s'}}>
            منصة متكاملة تدمج أدوات المعلم الذكية، تحليلات الأداء الدقيقة، والتعلم التفاعلي للطلاب في مكان واحد. مستقبل التعليم يبدأ هنا.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{animationDelay: '0.2s'}}>
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>ابدأ التجربة مجاناً</span>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <a 
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined filled-icon text-slate-400">play_circle</span>
              شاهد كيف يعمل
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-[#0d1c12] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">أدوات مصممة بعناية لتمكين المعلمين وإلهام الطلاب.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card rounded-3xl p-8 group hover:border-primary-500/50 transition-all duration-500">
              <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <span className="material-symbols-outlined text-3xl">analytics</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">لوحات تحكم ذكية</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">رؤى فورية حول أداء الطلاب. اكتشف نقاط القوة والضعف بلمحة بصر واتخذ قرارات تعليمية مبنية على البيانات.</p>
            </div>
            <div className="glass-card rounded-3xl p-8 group hover:border-yellow-500/50 transition-all duration-500">
              <div className="size-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6">
                <span className="material-symbols-outlined text-3xl filled-icon">emoji_events</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">التعلم باللعب</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">شارات، نقاط، ولوحات صدارة تجعل من التعلم منافسة ممتعة ومحفزة للطلاب.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="demo" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-bold tracking-wider uppercase text-sm">التجربة التعليمية</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-2">كيف تعمل المنصة؟</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                step: '01', 
                title: 'إعداد الفصل', 
                desc: 'يقوم المعلم بإنشاء فصوله الدراسية وإضافة الطلاب بضغطة زر واحدة.', 
                icon: 'group_add',
                color: 'bg-blue-500'
              },
              { 
                step: '02', 
                title: 'تخصيص المحتوى', 
                desc: 'استخدام الذكاء الاصطناعي لإنشاء دروس واختبارات مخصصة لمستوى كل طالب.', 
                icon: 'auto_awesome',
                color: 'bg-primary-500'
              },
              { 
                step: '03', 
                title: 'تحليل النتائج', 
                desc: 'الحصول على تقارير دورية دقيقة وتنبيهات للطلاب الذين يحتاجون لدعم إضافي.', 
                icon: 'trending_up',
                color: 'bg-purple-500'
              }
            ].map((item, i) => (
              <div key={i} className="relative group p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-500">
                <div className={`${item.color} size-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-gray-200 dark:shadow-none group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <span className="absolute top-6 right-6 text-5xl font-black text-slate-100 dark:text-slate-900 -z-0 select-none opacity-50">{item.step}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 relative z-10 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schools Section */}
      <section id="schools" className="py-24 bg-slate-50 dark:bg-[#0d1c12] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <span className="text-primary-600 font-bold tracking-wider uppercase text-sm">للمدارس والمؤسسات</span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-2 mb-6 leading-tight">نظام إدارة تعليمي متكامل لمدرستك</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                نقدم للمدارس لوحات تحكم خاصة للمدراء، تتيح متابعة أداء المعلمين والطلاب، إدارة الفصول، واستخراج تقارير تفصيلية تساعد في اتخاذ القرارات الإدارية والتربوية.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {['إدارة مركزية للفصول', 'تقارير أداء دورية', 'تخصيص المناهج', 'دعم فني مخصص'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-bold">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={onStart} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all">
                اطلب عرضاً لمدرستك
              </button>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute inset-0 bg-primary-500 rounded-3xl blur-3xl opacity-10 animate-pulse"></div>
               <img 
                 src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" 
                 alt="Students Collaborating" 
                 className="rounded-3xl shadow-2xl relative z-10 border border-white dark:border-slate-800"
               />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">باقات تناسب الجميع</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">اختر الخطة المناسبة وابدأ رحلة التميز اليوم.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'طالب', price: 'مجاني', features: ['مكتبة دروس محدودة', 'اختبارات أساسية', 'لوحة تحكم طالب', 'دعم عبر البريد'], color: 'slate' },
              { title: 'معلم متميز', price: '49 ر.س', period: '/شهر', features: ['إنشاء دروس بالذكاء الاصطناعي', 'لوحات تحكم متقدمة', 'تقارير أداء مفصلة', 'مصحح نطق غير محدود', 'دعم فني مباشر'], highlight: true, color: 'primary' },
              { title: 'مدرسة', price: 'مخصص', features: ['لوحة تحكم للمدراء', 'عدد طلاب غير محدود', 'تخصيص كامل للهوية', 'تدريب مباشر للفريق', 'مدير حساب مخصص'], color: 'blue' }
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-3xl border transition-all duration-500 flex flex-col ${
                plan.highlight 
                  ? 'bg-white dark:bg-slate-900 border-primary-500 shadow-2xl scale-105 z-10' 
                  : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
              }`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white px-6 py-1.5 rounded-full text-xs font-black shadow-lg uppercase tracking-wider">
                    الأكثر طلباً
                  </div>
                )}
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{plan.title}</h3>
                <div className="mb-8">
                  <span className="text-5xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 text-sm font-bold">{plan.period}</span>}
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                      <span className={`material-symbols-outlined text-lg ${plan.highlight ? 'text-primary-500' : 'text-slate-400'}`}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={onStart}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    plan.highlight 
                      ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-xl shadow-primary-500/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  ابدأ الآن
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 bg-slate-50 dark:bg-[#0d1c12] relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-primary-600 font-bold tracking-wider uppercase text-sm">من نحن؟</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-2 mb-8 leading-tight">نؤمن بأن كل طالب يستحق معلماً ذكياً</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-12">
            انطلقت منصة "الداعم التعليمي" كحل لسد الفجوة بين التقنيات الحديثة واحتياجات الفصول الدراسية. نحن فريق من التربويين وخبراء التكنولوجيا، نهدف لتمكين المعلمين بالأدوات اللازمة لمساعدتهم على التركيز على ما يهم فعلاً: **إلهام الطلاب**.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[
               { val: '+100k', label: 'طالب نشط' },
               { val: '98%', label: 'رضا المعلمين' },
               { val: '24/7', label: 'دعم ذكي' },
               { val: '+500', label: 'مدرسة شريكة' }
             ].map((stat, i) => (
               <div key={i} className="p-4">
                 <p className="text-3xl font-black text-primary-500 mb-1">{stat.val}</p>
                 <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative">
            <div className="absolute inset-0 bg-primary-600 opacity-5 z-0"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 relative z-10">
              <div className="p-8 md:p-16 text-white">
                <h2 className="text-3xl md:text-5xl font-black mb-6">تواصل معنا</h2>
                <p className="text-slate-400 mb-10 text-lg">هل لديك استفسار أو ترغب في دمج المنصة في مدرستك؟ فريقنا جاهز للإجابة على جميع تساؤلاتك.</p>
                <div className="space-y-6">
                  <div className="flex items-center gap-6 group">
                    <div className="size-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-black">البريد الإلكتروني</p>
                      <p className="text-lg font-bold">hello@smart-edu.sa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                    <div className="size-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <span className="material-symbols-outlined">phone</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-black">رقم التواصل</p>
                      <p className="text-lg font-bold">+966 50 123 4567</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-8 md:p-16 border-l border-white/10">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="الاسم الكامل" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-primary-500 outline-none transition-all" />
                    <input type="email" placeholder="البريد الإلكتروني" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-primary-500 outline-none transition-all" />
                  </div>
                  <input type="text" placeholder="الموضوع" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-primary-500 outline-none transition-all" />
                  <textarea placeholder="رسالتك هنا..." rows={4} className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-primary-500 outline-none transition-all resize-none"></textarea>
                  <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-primary-500/20 transition-all">
                    إرسال الرسالة
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                 <span className="material-symbols-outlined text-primary-500 text-4xl">school</span>
                 <span className="text-3xl font-black text-white">الداعم التعليمي</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed text-lg mb-6">نحن نبني الجيل القادم من حلول التعليم الذكية لمساعدة المعلمين والطلاب على الوصول لأقصى إمكاناتهم.</p>
              <div className="flex gap-4">
                {['twitter', 'facebook', 'instagram', 'linkedin'].map(s => (
                  <a key={s} href="#" className="size-10 rounded-xl bg-slate-900 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all">
                    <span className="text-xs font-black uppercase">{s[0]}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-black text-white text-xl mb-6">روابط سريعة</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-primary-400 transition-colors">الميزات الأساسية</a></li>
                <li><a href="#demo" className="hover:text-primary-400 transition-colors">كيفية العمل</a></li>
                <li><a href="#schools" className="hover:text-primary-400 transition-colors">للمؤسسات التعليمية</a></li>
                <li><a href="#pricing" className="hover:text-primary-400 transition-colors">خطط الأسعار</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white text-xl mb-6">الدعم والمساعدة</h4>
              <ul className="space-y-3">
                <li><a href="#about" className="hover:text-primary-400 transition-colors">عن المنصة</a></li>
                <li><a href="#contact" className="hover:text-primary-400 transition-colors">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">الأسئلة الشائعة</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">سياسة الخصوصية</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} منصة الداعم التعليمي الذكية. صنع بكل حب في الوطن العربي ❤️</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
              <a href="#" className="hover:text-white transition-colors">إرشادات الاستخدام</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;