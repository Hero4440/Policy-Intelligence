export type TabId = 'coverage' | 'readiness' | 'changes' | 'compare' | 'ask';

type DetailTabsProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

const tabs: { id: TabId; label: string }[] = [
  { id: 'coverage', label: 'Coverage' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'changes', label: 'Changes' },
  { id: 'compare', label: 'Compare' },
  { id: 'ask', label: 'Ask' },
];

export function DetailTabs({ activeTab, onTabChange }: DetailTabsProps) {
  return (
    <nav className="tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn${activeTab === tab.id ? ' tab-btn-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
