import React, { useState } from 'react';

// --- Mock Data ---
const initialRevenue = {
  totalSales: 142500, // Total ticket volume processed
  platformFees: 7125, // Assuming 5% fee
  pendingPayouts: 34000
};

const initialFlaggedEvents = [
  { 
    id: 'EV-9921', 
    title: 'Earn $500 Crypto Masterclass', 
    organizer: 'Blockchain Wizards', 
    reason: 'Suspicious Virtual Link (Phishing Risk)', 
    reportedBy: 'System AI', 
    time: '20m ago',
    type: 'Online',
    virtual_link: 'http://bit.ly/scam-zoom-meeting-xyz',
    banner: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
    description: 'Join this mandatory seminar to claim your free tokens. You must connect your wallet to enter the meeting room.'
  },
  { 
    id: 'EV-8842', 
    title: 'Secret Midnight Meetup', 
    organizer: 'Unknown Host', 
    reason: 'Explicit Banner Image', 
    reportedBy: '15 Users', 
    time: '1h ago',
    type: 'InPerson',
    location: 'Central Park, NY',
    banner: 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=600&q=80',
    description: 'A private gathering. Do not share this link.'
  }
];

const initialWaitlistEscalations = [
  { id: 'EV-4412', title: 'React Conf 2026', type: 'InPerson', location: 'San Francisco, CA', capacity: 500, registered: 1250, conversionEst: '$12,000' },
  { id: 'EV-5521', title: 'AI Startup Pitch Night', type: 'InPerson', location: 'Austin, TX', capacity: 100, registered: 450, conversionEst: '$3,500' },
  { id: 'EV-6633', title: 'UX Design Workshop', type: 'Online', max_attendees: 50, registered: 120, conversionEst: '$800' }
];

const initialCancelledEvents = [
  { id: 'EV-3392', title: 'Global Tech Summit', org: 'TechCrunch', registered: 450, totalRefund: 22500, status: 'Pending Refunds' },
  { id: 'EV-1102', title: 'Vue.js Workshop', org: 'Frontend Masters', registered: 120, totalRefund: 4800, status: 'Pending Refunds' }
];

const initialSponsorshipRequests = [
  { id: 'EV-8821', title: 'React Developers Meetup', org: 'Vercel', offer: '$150', duration: '7 Days', status: 'Pending Approval' },
  { id: 'EV-8899', title: 'Node.js Conf', org: 'OpenJS', offer: '$300', duration: '14 Days', status: 'Pending Approval' }
];

const initialFraudAlerts = [
  { id: 'EV-7723', title: 'Free iPhone Giveaway Party', org: 'Unknown', velocity: '540/hr', riskScore: '98%', fakeAccounts: 480 },
  { id: 'EV-7700', title: 'Airdrop Crypto Fest', org: 'Web3 DAO', velocity: '320/hr', riskScore: '85%', fakeAccounts: 150 }
];

export default function UpcomingEventsBreakdown() {
  const [flaggedEvents, setFlaggedEvents] = useState(initialFlaggedEvents);
  const [waitlistEvents, setWaitlistEvents] = useState(initialWaitlistEscalations);
  const [cancelledEvents, setCancelledEvents] = useState(initialCancelledEvents);
  const [sponsorshipRequests, setSponsorshipRequests] = useState(initialSponsorshipRequests);
  const [fraudAlerts, setFraudAlerts] = useState(initialFraudAlerts);
  
  const [toastMessage, setToastMessage] = useState('');
  const [previewEvent, setPreviewEvent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(null);
  const [revenue, setRevenue] = useState(initialRevenue);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleTakedown = (id) => {
    setFlaggedEvents(flaggedEvents.filter(e => e.id !== id));
    setPreviewEvent(null);
    showToast(`Event ${id} has been permanently taken down.`);
  };

  const handleProcessPayouts = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setRevenue(prev => ({ ...prev, pendingPayouts: 0 }));
      showToast('Successfully processed $34,000 in payouts to organizers.');
    }, 1500);
  };

  const handleUpsell = (id) => {
    setWaitlistEvents(waitlistEvents.filter(e => e.id !== id));
    showToast(`Automated upsell email sent to organizer of ${id}.`);
  };

  const handleBulkRefund = (id, amount) => {
    setIsRefunding(id);
    setTimeout(() => {
      setIsRefunding(null);
      setCancelledEvents(cancelledEvents.filter(e => e.id !== id));
      setRevenue(prev => ({ ...prev, pendingPayouts: Math.max(0, prev.pendingPayouts - amount) }));
      showToast(`Successfully processed bulk refunds for event ${id}.`);
    }, 1500);
  };

  const handleApproveSponsor = (id, amount) => {
    setSponsorshipRequests(sponsorshipRequests.filter(e => e.id !== id));
    setRevenue(prev => ({ ...prev, platformFees: prev.platformFees + amount }));
    showToast(`Approved sponsorship. Event ${id} is now featured!`);
  };

  const handlePurgeBots = (id) => {
    setFraudAlerts(fraudAlerts.filter(e => e.id !== id));
    showToast(`Successfully purged bot registrations for event ${id}.`);
  };

  return (
    <div className="flex flex-col gap-8 relative pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[95vw] overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{previewEvent.title}</h2>
                <p className="text-gray-500">Organized by {previewEvent.organizer} • {previewEvent.id}</p>
              </div>
              <button onClick={() => setPreviewEvent(null)} className="text-gray-400 hover:text-gray-900 shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
              <div className="w-full h-40 bg-gray-200">
                <img src={previewEvent.banner} alt="Event Banner" className="w-full h-full object-cover" />
              </div>
              
              <div className="p-6">
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 shadow-sm">
                  <h4 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[18px]">warning</span> Moderation Flag
                  </h4>
                  <p className="text-sm text-red-700">{previewEvent.reason}</p>
                  <p className="text-xs text-red-600 mt-2 font-medium">Reported by: {previewEvent.reportedBy}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Event Type</p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">
                        {previewEvent.type === 'Online' ? 'videocam' : 'location_on'}
                      </span>
                      {previewEvent.type}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 truncate">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                      {previewEvent.type === 'Online' ? 'Virtual Link' : 'Location'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {previewEvent.type === 'Online' ? previewEvent.virtual_link : previewEvent.location}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Event Description</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {previewEvent.description}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setPreviewEvent(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => handleTakedown(previewEvent.id)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">block</span>
                Takedown Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Ticket Revenue & Financials Center */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-xl p-8 shadow-xl text-white border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 text-3xl">account_balance</span>
              Ticketing & Platform Revenue
            </h3>
            <p className="text-sm text-slate-400 mt-1">Manage ticket sales, platform fees, and organizer payouts.</p>
          </div>
          <button 
            onClick={handleProcessPayouts}
            disabled={isProcessing || revenue.pendingPayouts === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold px-6 py-3 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">payments</span>
            )}
            {revenue.pendingPayouts === 0 ? 'All Payouts Cleared' : 'Process Pending Payouts'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-6 border border-white/5 backdrop-blur-sm">
            <p className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">Total Ticket GMV</p>
            <p className="text-4xl font-black text-white">${revenue.totalSales.toLocaleString()}</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-400/10 w-fit px-2 py-1 rounded">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +12% this month
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-6 border border-white/5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">account_balance_wallet</span>
            </div>
            <p className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">Platform Fees (Admin Cut)</p>
            <p className="text-4xl font-black text-green-400">${revenue.platformFees.toLocaleString()}</p>
            <p className="mt-3 text-xs text-slate-400">Based on 5% platform transaction fee</p>
          </div>

          <div className="bg-white/10 rounded-lg p-6 border border-white/5 backdrop-blur-sm border-l-4 border-l-amber-400">
            <p className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">Pending Organizer Payouts</p>
            <p className="text-4xl font-black text-white">${revenue.pendingPayouts.toLocaleString()}</p>
            <p className="mt-3 text-xs text-amber-300 font-medium">{revenue.pendingPayouts > 0 ? 'Action required: Release funds' : 'All organizers paid'}</p>
          </div>
        </div>
      </div>

      {/* PHASE 2: Enterprise Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bulk Refund & Cancellation Center */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="bg-orange-50 p-5 border-b border-orange-100">
            <h3 className="text-base font-bold text-orange-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">currency_exchange</span>
              Refund & Cancellation Desk
            </h3>
            <p className="text-xs text-orange-700 mt-1">Manage bulk refunds for cancelled events.</p>
          </div>
          <div className="flex-1 p-0 overflow-y-auto">
            {cancelledEvents.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">task_alt</span>
                <p className="text-gray-500 font-medium text-sm">No pending refunds.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {cancelledEvents.map(event => (
                  <li key={event.id} className="p-5 hover:bg-orange-50/30 transition-colors">
                    <h4 className="font-bold text-gray-900 text-sm">{event.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{event.org} • {event.registered} Attendees</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-black text-orange-600">-${event.totalRefund.toLocaleString()}</span>
                      <button 
                        onClick={() => handleBulkRefund(event.id, event.totalRefund)}
                        disabled={isRefunding === event.id}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors flex items-center gap-1"
                      >
                        {isRefunding === event.id ? (
                          <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        ) : (
                          <span className="material-symbols-outlined text-[14px]">undo</span>
                        )}
                        Bulk Refund
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sponsored Event Approval Desk */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="bg-emerald-50 p-5 border-b border-emerald-100">
            <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">campaign</span>
              Sponsorship Requests
            </h3>
            <p className="text-xs text-emerald-700 mt-1">Approve paid "Featured" event requests.</p>
          </div>
          <div className="flex-1 p-0 overflow-y-auto">
            {sponsorshipRequests.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">task_alt</span>
                <p className="text-gray-500 font-medium text-sm">No pending sponsorships.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sponsorshipRequests.map(event => (
                  <li key={event.id} className="p-5 hover:bg-emerald-50/30 transition-colors">
                    <h4 className="font-bold text-gray-900 text-sm">{event.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{event.org} • Feature for {event.duration}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-600">+{event.offer}</span>
                      <button 
                        onClick={() => handleApproveSponsor(event.id, parseInt(event.offer.replace('$', '')))}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Approve & Charge
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bot Registration Scanner */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="bg-purple-50 p-5 border-b border-purple-100">
            <h3 className="text-base font-bold text-purple-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600">smart_toy</span>
              Bot Fraud Scanner
            </h3>
            <p className="text-xs text-purple-700 mt-1">Detect events with abnormal registration velocity.</p>
          </div>
          <div className="flex-1 p-0 overflow-y-auto">
            {fraudAlerts.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">security</span>
                <p className="text-gray-500 font-medium text-sm">Platform is clean.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {fraudAlerts.map(event => (
                  <li key={event.id} className="p-5 hover:bg-purple-50/30 transition-colors">
                    <h4 className="font-bold text-gray-900 text-sm">{event.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">Velocity: <span className="font-bold text-purple-600">{event.velocity}</span> • Risk: <span className="text-red-600 font-bold">{event.riskScore}</span></p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {event.fakeAccounts} Fake Accounts
                      </span>
                      <button 
                        onClick={() => handlePurgeBots(event.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                        Purge Bots
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Waitlist Escalation Center */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="bg-blue-50 p-6 border-b border-blue-100">
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">groups</span>
              Waitlist Escalation Center
            </h3>
            <p className="text-sm text-blue-700 mt-1">Events where registration massively exceeds maximum capacity. Upsell paid promotion or venue upgrades.</p>
          </div>
          
          <div className="flex-1 p-0 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-semibold">Event</th>
                  <th className="p-4 font-semibold text-center">Overbooking</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waitlistEvents.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500">No overbooked events.</td>
                  </tr>
                ) : (
                  waitlistEvents.map(event => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <p className="font-bold text-gray-900 text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            {event.type === 'Online' ? 'videocam' : 'location_on'}
                          </span>
                          {event.type === 'Online' ? 'Virtual' : event.location}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1 overflow-hidden">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                          <p className="text-xs font-bold text-red-600">{event.registered} / {event.capacity || event.max_attendees}</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleUpsell(event.id)}
                          className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold px-3 py-2 rounded shadow-sm transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          Upsell Sponsor Tier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Moderation Queue */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="bg-red-50 p-6 border-b border-red-100">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">gavel</span>
              Event Moderation Queue
            </h3>
            <p className="text-sm text-red-700 mt-1">Flagged events containing suspicious virtual links or explicit banners.</p>
          </div>
          
          <div className="flex-1 p-0 overflow-y-auto">
            {flaggedEvents.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-gray-300 text-5xl mb-3">verified</span>
                <p className="text-gray-500 font-medium">All events are verified and safe!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {flaggedEvents.map(event => (
                  <li key={event.id} className="p-6 hover:bg-red-50/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">Org: {event.organizer}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">{event.time}</span>
                    </div>
                    
                    <div className="mb-4 bg-red-50 border border-red-100 p-3 rounded-lg">
                      <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                        Flag: {event.reason}
                      </p>
                      {event.virtual_link && (
                        <p className="text-xs text-red-600 mt-1 truncate font-mono bg-red-100/50 p-1 rounded">
                          Link: {event.virtual_link}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPreviewEvent(event)}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold py-2 rounded transition-colors flex justify-center items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span> Review Event
                      </button>
                      <button 
                        onClick={() => handleTakedown(event.id)}
                        className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs font-semibold py-2 rounded transition-colors flex justify-center items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">block</span> Takedown
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
