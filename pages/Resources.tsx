import React, { useState } from 'react';

const Resources: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-primary-500 mb-4">folder_shared</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">المصادر التعليمية</h1>
        <p className="text-slate-500 dark:text-slate-400">مكتبة شاملة من المصادر والمراجع التعليمية</p>
        <button className="mt-6 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold">
          قريباً
        </button>
      </div>
    </div>
  );
};

export default Resources;