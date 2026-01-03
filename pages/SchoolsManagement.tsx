import React, { useState } from 'react';

const SchoolsManagement: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-primary-500 mb-4">domain</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">إدارة المدارس</h1>
        <p className="text-slate-500 dark:text-slate-400">إدارة شاملة للمدارس والمعلمين والطلاب</p>
        <button className="mt-6 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold">
          قريباً
        </button>
      </div>
    </div>
  );
};

export default SchoolsManagement;