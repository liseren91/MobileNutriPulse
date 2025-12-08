import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, CalendarDays, ShoppingCart, MessageCircle } from 'lucide-react';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: ViewState.DASHBOARD, icon: LayoutDashboard, label: 'Статус' },
    { view: ViewState.MEALS, icon: CalendarDays, label: 'План' },
    { view: ViewState.SHOPPING, icon: ShoppingCart, label: 'Список' },
    { view: ViewState.CHAT, icon: MessageCircle, label: 'Коуч' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};