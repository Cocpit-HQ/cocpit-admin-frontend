import React, { useState } from 'react';
import Header from '../components/Header';

export default function ContactSupport() {
  const [activeTicketId, setActiveTicketId] = useState(1);
  const [adminNote, setAdminNote] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  // Mock data for tickets
  const tickets = [
    {
      id: 1,
      email: 'alex.viva2323@gmail.com',
      issue: 'Page is not working. Every time I try to load my profile, it throws an error and nothing happens.',
      attachment: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      status: 'Open',
      date: '2026-07-30T10:15:00Z',
    },
    {
      id: 2,
      email: 'johndoe@example.com',
      issue: 'Cannot upload my company logo.',
      attachment: null,
      status: 'Pending',
      date: '2026-07-29T14:20:00Z',
    },
    {
      id: 3,
      email: 'sarah.smith@example.org',
      issue: 'I need to change my primary email address.',
      attachment: null,
      status: 'Resolved',
      date: '2026-07-28T09:00:00Z',
    },
  ];

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || tickets[0];

  return (
    <div className="flex flex-col flex-1 bg-surface min-h-screen relative overflow-x-hidden md:pl-[80px] group-hover:md:pl-[280px] transition-all duration-300">
      <Header title="Contact Support" />
      
      <main className="flex flex-1 flex-col md:flex-row pt-20 md:pt-24 max-w-7xl mx-auto w-full p-4 md:p-6 gap-6 h-[calc(100vh-2rem)]">
        
        {/* Left Sidebar - Ticket List */}
        <div className="w-full md:w-1/3 flex flex-col bg-surface-container rounded-xl border border-outline-variant overflow-hidden shadow-sm h-full max-h-full">
          <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center shrink-0">
            <h2 className="font-headline-sm text-on-surface font-semibold">Support Inbox</h2>
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-bold">
              {tickets.length} Tickets
            </span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setActiveTicketId(ticket.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeTicketId === ticket.id
                    ? 'bg-primary-container border-primary text-on-primary-container shadow-sm'
                    : 'bg-surface border-outline-variant hover:border-primary/50 text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold truncate pr-2">{ticket.email}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm shrink-0 ${
                    ticket.status === 'Open' ? 'bg-error-container text-error' :
                    ticket.status === 'Pending' ? 'bg-warning-container text-warning' :
                    'bg-success-container text-success'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <p className={`text-xs line-clamp-2 ${activeTicketId === ticket.id ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>
                  {ticket.issue}
                </p>
                <div className={`text-[10px] mt-2 ${activeTicketId === ticket.id ? 'text-on-primary-container/60' : 'text-on-surface-variant/70'}`}>
                  {new Date(ticket.date).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Main Area - Ticket Details */}
        <div className="w-full md:w-2/3 flex flex-col gap-4 h-full">
          
          {/* Header Action Bar */}
          <div className="bg-surface-container rounded-xl border border-outline-variant p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm shrink-0">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">User Email</span>
                <span className="text-sm font-semibold text-on-surface truncate">{activeTicket.email}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button 
                className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
                title="View User Profile"
              >
                <span className="material-symbols-outlined">visibility</span>
              </button>
              
              <select 
                className="h-10 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                value={activeTicket.status}
                onChange={() => {}}
              >
                <option value="Open">Open</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-surface-container rounded-xl border border-outline-variant shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-high shrink-0">
              <h3 className="font-headline-sm text-on-surface font-semibold">Ticket Information</h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 md:gap-6 items-start">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider md:pt-1">Email</span>
                <div className="bg-surface p-3 rounded-lg border border-outline-variant text-sm text-on-surface">
                  {activeTicket.email}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 md:gap-6 items-start">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider md:pt-1">Issue</span>
                <div className="bg-surface p-4 rounded-lg border border-outline-variant text-sm text-on-surface whitespace-pre-wrap min-h-[100px]">
                  {activeTicket.issue}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 md:gap-6 items-start">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider md:pt-1">Attachment</span>
                <div className="bg-surface p-2 rounded-lg border border-outline-variant">
                  {activeTicket.attachment ? (
                    <img 
                      src={activeTicket.attachment} 
                      alt="User uploaded attachment" 
                      className="max-w-full h-auto max-h-[300px] object-contain rounded border border-outline-variant/50"
                    />
                  ) : (
                    <p className="text-sm text-on-surface-variant p-4 text-center">No attachment provided.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 md:gap-6 items-center">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Action</span>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                    Reply to User
                  </button>
                  <button className="px-4 py-2 bg-surface text-primary border border-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors">
                    Mark as Resolved
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Inputs Section (Notes & Replies) */}
          <div className="flex flex-col gap-4 shrink-0">
            <div className="bg-surface-container rounded-xl border border-outline-variant p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
               <textarea
                 className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none resize-none p-2"
                 rows={2}
                 placeholder="Add an internal admin note..."
                 value={adminNote}
                 onChange={(e) => setAdminNote(e.target.value)}
               ></textarea>
            </div>
            
            <div className="bg-surface-container rounded-xl border border-outline-variant p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all flex flex-col">
               <textarea
                 className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none resize-none p-2 flex-1"
                 rows={3}
                 placeholder="Write a reply message to the user..."
                 value={replyMessage}
                 onChange={(e) => setReplyMessage(e.target.value)}
               ></textarea>
               <div className="flex justify-end p-2 border-t border-outline-variant/30 mt-2">
                 <button className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                   <span className="material-symbols-outlined text-[18px]">send</span>
                   Send Reply
                 </button>
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
