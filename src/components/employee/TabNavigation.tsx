
import React from "react";

interface Tab {
  id: string;
  label: string;
  isActive?: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTabId?: string;
  onTabChange: (tabId: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTabId,
  onTabChange,
}) => {
  return (
    <div className="flex w-full max-w-full items-stretch text-black border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`cursor-pointer relative ${
            tab.isActive || tab.id === activeTabId
              ? "text-[rgba(221,1,1,1)] font-bold"
              : "text-black hover:text-gray-600"
          }`}
        >
          <div className="gap-2.5 p-4">{tab.label}</div>
          {(tab.isActive || tab.id === activeTabId) && (
            <div className="bg-[rgba(221,1,1,1)] absolute bottom-0 left-0 right-0 h-[3px] rounded-t" />
          )}
        </div>
      ))}
    </div>
  );
};
