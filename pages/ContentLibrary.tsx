import React, { useState } from 'react';

interface ContentItem {
  id: number;
  title: string;
  description: string;
  type: 'video' | 'document' | 'interactive' | 'audio' | 'image';
  subject: string;
  gradeLevel: number;
  difficulty: 'easy' | 'medium' | 'hard';
  duration?: string;
  thumbnail: string;
  url: string;
  viewCount: number;
  rating: number;
  tags: string[];
  createdAt: string;
  isFavorite: boolean;
}

const mockContent: ContentItem[] = [
  {
    id: 1,
    title: 'شرح الكسور العشرية بالفيديو',
    description: 'شرح مبسط ومفصل للكسور العشرية مع أمثلة تطبيقية',
    type: 'video',
    subject: 'رياضيات',
    gradeLevel: 5,
    difficulty: 'medium',
    duration: '15:30',
    thumbnail: 'https://img.freepik.com/free-vector/math-background_23-2148146270.jpg',
    url: 'https://www.youtube.com/embed/5K1-D5K2-t0',
    viewCount: 1250,
    rating: 4.8,
    tags: ['كسور', 'عشرية', 'رياضيات'],
    createdAt: '2024-01-10',
    isFavorite: true
  },
  {
    id: 2,
    title: 'قواعد النحو - الفاعل والمفعول',
    description: 'درس تفاعلي يوضح الفرق بين الفاعل والمفعول به مع التمارين',
    type: 'interactive',
    subject: 'لغة عربية',
    gradeLevel: 4,
    difficulty: 'easy',
    thumbnail: 'https://img.freepik.com/free-vector/arabic-calligraphy-concept_23-2148955307.jpg',
    url: '/interactive/grammar-lesson-1',
    viewCount: 890,
    rating: 4.6,
    tags: ['نحو', 'فاعل', 'مفعول'],
    createdAt: '2024-01-08',
    isFavorite: false
  },
  {
    id: 3,
    title: 'دورة حياة النبات - عرض تقديمي',
    description: 'عرض تقديمي شامل عن مراحل نمو النبات من البذرة إلى الثمرة',
    type: 'document',
    subject: 'علوم',
    gradeLevel: 3,
    difficulty: 'easy',
    thumbnail: 'https://img.freepik.com/free-vector/hand-drawn-photosynthesis-infographic_23-2149028703.jpg',
    url: '/documents/plant-lifecycle.pdf',
    viewCount: 650,
    rating: 4.9,
    tags: ['نبات', 'دورة حياة', 'علوم'],
    createdAt: '2024-01-05',
    isFavorite: true
  },
  {
    id: 4,
    title: 'تاريخ الحضارة الإسلامية',
    description: 'رحلة صوتية عبر تاريخ الحضارة الإسلامية وإنجازاتها',
    type: 'audio',
    subject: 'تاريخ',
    gradeLevel: 6,
    difficulty: 'hard',
    duration: '25:00',
    thumbnail: 'https://img.freepik.com/free-vector/ancient-rome-flat-composition_1284-73238.jpg',
    url: '/audio/islamic-civilization.mp3',
    viewCount: 420,
    rating: 4.7,
    tags: ['تاريخ', 'حضارة', 'إسلام'],
    createdAt: '2024-01-03',
    isFavorite: false
  },
  {
    id: 5,
    title: 'خريطة العالم التفاعلية',
    description: 'استكشف قارات وبلدان العالم من خلال خريطة تفاعلية',
    type: 'interactive',
    subject: 'جغرافيا',
    gradeLevel: 5,
    difficulty: 'medium',
    thumbnail: 'https://img.freepik.com/free-vector/world-map-with-countries_23-2147781395.jpg',
    url: '/interactive/world-map',
    viewCount: 980,
    rating: 4.5,
    tags: ['جغرافيا', 'خريطة', 'عالم'],
    createdAt: '2024-01-01',
    isFavorite: false
  },
  {
    id: 6,
    title: 'أشكال الطاقة في الطبيعة',
    description: 'صور توضيحية لأنواع الطاقة المختلفة وتطبيقاتها',
    type: 'image',
    subject: 'علوم',
    gradeLevel: 4,
    difficulty: 'medium',
    thumbnail: 'https://img.freepik.com/free-vector/renewable-energy-concept_23-2148525043.jpg',
    url: '/images/energy-types-gallery',
    viewCount: 750,
    rating: 4.4,
    tags: ['طاقة', 'طبيعة', 'علوم'],
    createdAt: '2023-12-28',
    isFavorite: true
  }
];

const ContentLibrary: React.FC = () => {
  const [content] = useState<ContentItem[]>(mockContent);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique subjects
  const subjects = Array.from(new Set(content.map(item => item.subject)));

  // Filter content
  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesSubject && matchesType && matchesDifficulty;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'play_circle';
      case 'document': return 'description';
      case 'interactive': return 'touch_app';
      case 'audio': return 'volume_up';
      case 'image': return 'image';
      default: return 'article';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      case 'document': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'interactive': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      case 'audio': return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      case 'image': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'سهل';
      case 'medium': return 'متوسط';
      case 'hard': return 'صعب';
      default: return difficulty;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'video': return 'فيديو';
      case 'document': return 'مستند';
      case 'interactive': return 'تفاعلي';
      case 'audio': return 'صوتي';
      case 'image': return 'صور';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">مكتبة المحتوى التعليمي</h1>
          <p className="text-slate-500 dark:text-slate-400">استكشف مجموعة واسعة من المواد التعليمية التفاعلية</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined">view_list</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="ابحث في المحتوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-3 px-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="all">جميع المواد</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-3 px-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="all">جميع الأنواع</option>
              <option value="video">فيديو</option>
              <option value="document">مستند</option>
              <option value="interactive">تفاعلي</option>
              <option value="audio">صوتي</option>
              <option value="image">صور</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full py-3 px-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="all">جميع المستويات</option>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400">
          عرض {filteredContent.length} من أصل {content.length} عنصر
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>ترتيب حسب:</span>
          <select className="bg-transparent border-none outline-none font-bold">
            <option>الأحدث</option>
            <option>الأكثر مشاهدة</option>
            <option>الأعلى تقييماً</option>
          </select>
        </div>
      </div>

      {/* Content Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedContent(item)}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className={`p-3 rounded-full ${getTypeColor(item.type)} opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0`}>
                    <span className="material-symbols-outlined text-2xl">{getTypeIcon(item.type)}</span>
                  </div>
                </div>
                
                {/* Type Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getTypeColor(item.type)}`}>
                    {getTypeText(item.type)}
                  </span>
                </div>

                {/* Duration (for video/audio) */}
                {item.duration && (
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                    {item.duration}
                  </div>
                )}

                {/* Favorite */}
                <button className="absolute top-3 left-3 p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
                  <span className={`material-symbols-outlined text-lg ${item.isFavorite ? 'text-red-500' : 'text-white'}`}>
                    {item.isFavorite ? 'favorite' : 'favorite_border'}
                  </span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-primary-600">{item.subject}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">الصف {item.gradeLevel}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getDifficultyColor(item.difficulty)}`}>
                    {getDifficultyText(item.difficulty)}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>{item.viewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-yellow-500">star</span>
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  <span>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContent.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedContent(item)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group flex gap-6"
            >
              {/* Thumbnail */}
              <div className="relative w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className={`absolute inset-0 flex items-center justify-center ${getTypeColor(item.type)} bg-opacity-90`}>
                  <span className="material-symbols-outlined text-xl">{getTypeIcon(item.type)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-primary-600">{item.subject}</span>
                      <span className="text-sm text-slate-400">•</span>
                      <span className="text-sm text-slate-500">الصف {item.gradeLevel}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getDifficultyColor(item.difficulty)}`}>
                        {getDifficultyText(item.difficulty)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className={`material-symbols-outlined ${item.isFavorite ? 'text-red-500' : 'text-slate-400'}`}>
                      {item.isFavorite ? 'favorite' : 'favorite_border'}
                    </span>
                  </button>
                </div>

                <p className="text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>{item.viewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-yellow-500">star</span>
                      <span>{item.rating}</span>
                    </div>
                    {item.duration && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{item.duration}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">search_off</span>
          <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">لا توجد نتائج</h3>
          <p className="text-slate-400">جرب تغيير معايير البحث أو المرشحات</p>
        </div>
      )}

      {/* Content Viewer Modal */}
      {selectedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedContent.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-primary-600 font-bold">{selectedContent.subject}</span>
                  <span className="text-sm text-slate-400">•</span>
                  <span className="text-sm text-slate-500">الصف {selectedContent.gradeLevel}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getTypeColor(selectedContent.type)}`}>
                    {getTypeText(selectedContent.type)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContent(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Content Display */}
            <div className="flex-1 overflow-y-auto">
              {selectedContent.type === 'video' && (
                <div className="relative pt-[56.25%] bg-black">
                  <iframe 
                    src={`${selectedContent.url}?rel=0&modestbranding=1`}
                    className="absolute inset-0 w-full h-full"
                    title={selectedContent.title}
                    frameBorder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              
              {selectedContent.type === 'image' && (
                <div className="p-6">
                  <img 
                    src={selectedContent.thumbnail} 
                    alt={selectedContent.title}
                    className="w-full rounded-xl"
                  />
                </div>
              )}
              
              {selectedContent.type === 'interactive' && (
                <div className="p-6 text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-12">
                    <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">touch_app</span>
                    <h4 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">محتوى تفاعلي</h4>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">انقر على الرابط أدناه لفتح المحتوى التفاعلي</p>
                    <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold">
                      فتح المحتوى التفاعلي
                    </button>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <h4 className="font-bold text-slate-800 dark:text-white mb-3">وصف المحتوى</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {selectedContent.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="material-symbols-outlined text-2xl text-slate-500 mb-1">visibility</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedContent.viewCount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">مشاهدة</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="material-symbols-outlined text-2xl text-yellow-500 mb-1">star</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedContent.rating}</p>
                    <p className="text-xs text-slate-500">تقييم</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="material-symbols-outlined text-2xl text-slate-500 mb-1">school</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">الصف {selectedContent.gradeLevel}</p>
                    <p className="text-xs text-slate-500">المستوى</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="material-symbols-outlined text-2xl text-slate-500 mb-1">calendar_today</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedContent.createdAt).toLocaleDateString('ar-EG')}</p>
                    <p className="text-xs text-slate-500">تاريخ النشر</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedContent.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-sm font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentLibrary;