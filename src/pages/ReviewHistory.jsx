import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const mockHistory = [
  {
    id: '#90221-BX',
    type: 'User',
    name: 'Marcus V.',
    status: 'Suspended',
    reason: 'Hate Speech / Harassment',
    contentPreview: '"This platform is garbage and everyone here is a complete moron. I\'m going to find where you..."',
    flaggedBy: '@SafetyBot_04',
    time: '14 mins ago',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl34ZW-QnwuANVglUDhG_gk2vschCwqxEVtT39bRNZVIVDsk_rjXiEn-6In9dEMdGfxpcc5QX6wN8iRj2fEIxlPf8QgxdXaoWa_JOZ0-hRWcy2kQ2XNR70Tki5f5HPBLJkfxmEsZrVesiOP_bcGuw5OHW8g1IWqcu0Nk7tbIN317tjx2ZV5a26k_14seMdN8Eqg5IwKa-rkBy4S_J0aQ41h7h_uO2PS19jY607SPQzRYvhHmGK4RwYd0n-xHgem-trIt1raRhtWIsa'
  },
  {
    id: '#MA-7722',
    type: 'Organization',
    name: 'Global Market Post',
    status: 'Rejected',
    reason: 'Suspected Spam',
    contentPreview: 'Multiple reports of repetitive commercial spam. Content identified as legitimate promotional campaign with prior authorization.',
    flaggedBy: '@user_prime_99',
    time: '2 hours ago',
    icon: 'article'
  },
  {
    id: '#11029-LK',
    type: 'User',
    name: 'Elena K.',
    status: 'Approved',
    reason: 'Sensitive IP Disclosure',
    contentPreview: 'Media attachment: system_diagram_v2.png',
    flaggedBy: '@CorpSecurity',
    time: '5 hours ago',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9Pz9PCYP__YK6z_ZjIjFQJ8N6JBrVsNCDUluwHVA_-bOEcD5_qBGWGnXR1xokdse9GnWQsKr07f7ZC4WWP5HUIZfb7aosU8Rnn6Ot_Bedv3PFiNjh6GwnHfnq8CHBHZSlOL5T_gBPPFJ0xYNOA-Mq7xPIJ11CNd-gmtRRJDYh_3AUAQwAj9Qpt-FA1VDnra4VsEyvwCiyf8DR-kE0NgisoT_vEPYzs6sUe3Km6DC50ZzAaXjUqDjjpPkUPcvxxsN4gUbz7qa3HPOE'
  },
  {
    id: '#99318-ZZ',
    type: 'User',
    name: '@anon_bot_net',
    status: 'Suspended',
    reason: 'Bot Activity Detection',
    contentPreview: 'System detected automated scripted activity. Account engaged in high-frequency polling exceeding rate limits by 1400%.',
    flaggedBy: 'System Sentinel',
    time: 'Yesterday',
    icon: 'alternate_email'
  },
  {
    id: '#APP-1002-Y',
    type: 'Appeal',
    name: 'Omar Al-Fayed',
    status: 'Reinstated',
    reason: 'Appeal for Suspended Account',
    contentPreview: 'My account was hacked. I did not post those crypto links.',
    flaggedBy: 'User Submission',
    time: 'Oct 23, 2023',
    icon: 'gavel'
  },
  {
    id: '#APP-1001-Z',
    type: 'Appeal',
    name: 'Crypto Scammer 99',
    status: 'Upheld',
    reason: 'Appeal for Suspended Account',
    contentPreview: 'Why was I banned? I did nothing wrong.',
    flaggedBy: 'User Submission',
    time: 'Oct 20, 2023',
    icon: 'gavel'
  }
];

export default function ReviewHistory() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(location.state?.filter || 'All Cases');
  const [visibleCount, setVisibleCount] = useState(4);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Suspended': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      case 'Rejected': return 'bg-error-container text-on-error-container';
      case 'Approved': return 'bg-secondary-container text-on-secondary-container';
      case 'Reinstated': return 'bg-green-100 text-green-700';
      case 'Upheld': return 'bg-error text-white';
      default: return 'bg-surface-container-high text-on-surface';
    }
  };

  const getIconColor = (status) => {
    switch (status) {
      case 'Suspended': return 'text-tertiary';
      case 'Rejected': return 'text-error';
      case 'Approved': return 'text-secondary';
      case 'Reinstated': return 'text-green-600';
      case 'Upheld': return 'text-error';
      default: return 'text-primary';
    }
  };

  const filteredHistory = mockHistory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.contentPreview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All Cases' || 
                          item.status === activeFilter || 
                          (activeFilter === 'Appeals' && item.type === 'Appeal');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col max-w-max-width mx-auto w-full pb-xl">
      <div className="flex flex-col gap-lg mb-xl">
        <Link 
          to="/moderation" 
          state={{ fromTab: location.state?.fromTab }}
          className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md w-max"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Moderation
        </Link>
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Review History</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">Audit past moderation decisions and platform safety actions.</p>
        </div>

        {/* Search Bar Section */}
        <div className="relative group w-full lg:w-1/2">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-full font-body-md text-on-surface placeholder-on-surface-variant/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            placeholder="Search moderation cases..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-sm overflow-x-auto no-scrollbar pb-md mb-md">
        {['All Cases', 'Approved', 'Rejected', 'Suspended', 'Appeals'].map(filter => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 px-md py-xs rounded-full font-label-md text-label-md transition-all active:scale-95 ${
              activeFilter === filter 
                ? 'bg-primary text-on-primary' 
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-md">
        {filteredHistory.slice(0, visibleCount).map((item, index) => (
          <div key={index} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm shadow-sm transition-all hover:border-primary/50">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
                  {item.image ? (
                    <img alt="User" className="w-full h-full object-cover" src={item.image} />
                  ) : (
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface leading-tight">{item.name}</h3>
                  <p className="text-[11px] text-on-surface-variant font-mono-label">ID: {item.id}</p>
                </div>
              </div>
              <span className={`px-sm py-xs rounded text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                {item.status}
              </span>
            </div>
            
            <div className={`bg-surface-container-low p-sm rounded-lg ${item.status === 'Suspended' ? 'border-l-4 border-tertiary-container' : ''}`}>
              <p className={`text-body-sm text-on-surface ${item.status !== 'Rejected' ? 'italic line-clamp-2' : ''}`}>
                {item.contentPreview}
              </p>
            </div>
            
            <div className="flex flex-col gap-xs pt-xs border-t border-outline-variant/10 mt-2">
              <div className="flex items-center gap-xs">
                <span className={`material-symbols-outlined text-[14px] ${getIconColor(item.status)}`}>
                  {item.status === 'Rejected' ? 'spam' : item.status === 'Approved' ? 'lock' : 'report'}
                </span>
                <span className={`text-body-sm font-semibold ${getIconColor(item.status)}`}>
                  {item.reason}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                <span>Flagged by: <span className="text-on-surface font-medium">{item.flaggedBy}</span></span>
                <span>{item.time}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="p-xl text-center text-on-surface-variant font-body-md bg-surface-container-low rounded-xl border border-outline-variant">
            No moderation cases found matching your search.
          </div>
        )}
      </div>

      {/* Footer Load More */}
      {visibleCount < filteredHistory.length && (
        <div className="mt-xl flex flex-col items-center">
          <button 
            onClick={() => setVisibleCount(prev => prev + 4)}
            className="w-full lg:w-1/3 py-md rounded-xl border border-outline-variant text-primary font-label-md text-label-md flex items-center justify-center gap-sm transition-all hover:bg-surface-container-low active:scale-[0.98]"
          >
            <span>LOAD MORE RECORDS</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          <p className="mt-md text-body-sm text-outline font-medium">Showing {visibleCount} of {filteredHistory.length} resolved cases</p>
        </div>
      )}
    </div>
  );
}
