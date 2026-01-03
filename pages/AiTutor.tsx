import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  time: string;
}

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "مرحباً يا بطل! 👋 أنا معلمك الذكي. كيف يمكنني مساعدتك في دراستك اليوم؟",
      sender: 'ai',
      time: 'الآن'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let responseText = "هذا سؤال رائع! دعني أشرح لك...";
      if (newMessage.text.includes("إعراب")) {
        responseText = "لإعراب هذه الكلمة، نحتاج أولاً لتحديد موقعها في الجملة. هل هي مبتدأ أم خبر أم فاعل؟";
      } else if (newMessage.text.includes("رياضيات") || newMessage.text.includes("حساب")) {
        responseText = "الرياضيات لعبة ممتعة! ما هي المسألة التي تحاول حلها؟";
      } else if (newMessage.text.includes("شكرا")) {
        responseText = "على الرحب والسعة! أنا هنا دائماً لمساعدتك. بالتوفيق!";
      }

      const aiResponse: Message = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'ai',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-xl">smart_toy</span>
            </div>
            <span className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">المعلم الذكي</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">متاح دائماً للمساعدة</p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0d1c12]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] md:max-w-[70%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`size-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold
                ${msg.sender === 'user' ? 'bg-primary-500' : 'bg-blue-500'}
              `}>
                {msg.sender === 'user' ? <span className="material-symbols-outlined text-sm">person</span> : <span className="material-symbols-outlined text-sm">smart_toy</span>}
              </div>
              <div>
                <div 
                  className={`p-4 rounded-2xl shadow-sm leading-relaxed text-sm whitespace-pre-wrap
                    ${msg.sender === 'user' 
                      ? 'bg-primary-500 text-white rounded-tl-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none border border-slate-100 dark:border-slate-700'}
                  `}
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-slate-400 mt-1 ${msg.sender === 'user' ? 'text-left' : 'text-right'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="size-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tr-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-1.5 h-12">
                <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="size-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <button className="p-3 text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <span className="material-symbols-outlined">add_photo_alternate</span>
          </button>
          <button className="p-3 text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
             <span className="material-symbols-outlined">mic</span>
          </button>
          <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center p-2 transition-all focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
            <textarea 
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="اكتب سؤالك هنا..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 text-slate-800 dark:text-white px-2 py-1 text-sm scrollbar-hide"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-3 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
          >
            <span className="material-symbols-outlined -scale-x-100">send</span>
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          الذكاء الاصطناعي قد يخطئ أحياناً. يرجى التحقق من المعلومات المهمة.
        </p>
      </div>
    </div>
  );
};

export default AiTutor;