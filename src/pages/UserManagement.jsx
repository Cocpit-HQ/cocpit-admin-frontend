import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';



export default function UserManagement() {
  const { role, accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [accessToken]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [userToWarn, setUserToWarn] = useState(null);
  const [warningReason, setWarningReason] = useState('Inappropriate Behavior');
  const [warningMessage, setWarningMessage] = useState('');

  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [bulkWarningReason, setBulkWarningReason] = useState('Inappropriate Behavior');
  const [bulkWarningMessage, setBulkWarningMessage] = useState('');

  const [suspendConfirmModalOpen, setSuspendConfirmModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const navigate = useNavigate();

  const handleSuspend = async () => {
    if (userToSuspend) {
      try {
        await fetch(`/api/admin/users/${userToSuspend.id}/suspend`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        setUsers(users.map(u => u.id === userToSuspend.id ? { ...u, status: 'Suspended' } : u));
        alert(`Successfully suspended ${userToSuspend.name}.`);
        setUserToSuspend(null);
      } catch (e) {
        console.error(e);
      }
    } else {
      alert(`Successfully suspended ${selectedUsers.size} users.`);
      setSelectedUsers(new Set());
    }
    setSuspendConfirmModalOpen(false);
  };

  const handleUnsuspend = async (user) => {
    if (window.confirm(`Are you sure you want to unsuspend ${user.name}? This will restore their access and reset their moderation flags to 0.`)) {
      try {
        await fetch(`/api/admin/users/${user.id}/unsuspend`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        setUsers(users.map(u => u.id === user.id ? { ...u, status: 'Active' } : u));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendBulkEmail = () => {
    alert(`Bulk warning sent to ${selectedUsers.size} selected users.\nReason: ${bulkWarningReason}`);
    setBulkEmailModalOpen(false);
    setBulkWarningReason('Inappropriate Behavior');
    setBulkWarningMessage('');
  };

  const handleSendWarning = async () => {
    if (!userToWarn) return;
    try {
      const response = await fetch(`/api/admin/users/${userToWarn.id}/warn`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: warningReason, message: warningMessage })
      });
      const data = await response.json();
      if (data.autoSuspended) {
        alert(`${userToWarn.name} has been warned and AUTOMATICALLY SUSPENDED due to exceeding 7 moderation flags.`);
        setUsers(users.map(u => u.id === userToWarn.id ? { ...u, status: 'Suspended' } : u));
      } else {
        alert(`Warning sent to ${userToWarn.name}. They now have ${data.moderation_flags} moderation flags.`);
      }
    } catch (e) {
      console.error(e);
    }
    setWarningModalOpen(false);
    setUserToWarn(null);
    setWarningMessage('');
  };

  const toggleUser = (id) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const getRoleClass = (role) => {
    switch (role.toUpperCase()) {
      case 'WORKING PROFESSIONAL': return 'bg-primary-fixed text-on-primary-fixed-variant';
      case 'STUDENT': return 'bg-secondary-fixed text-on-secondary-fixed-variant';
      case 'RECRUITER': return 'bg-primary-fixed text-on-primary-fixed-variant'; // using primary for recruiter as per original
      case 'FREELANCER': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Active': return <><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-body-md font-medium text-green-700">Active</span></>;
      case 'Suspended': return <><span className="w-2 h-2 rounded-full bg-orange-500"></span><span className="text-body-md font-medium text-orange-700">Suspended</span></>;
      case 'Deleted': return <><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-body-md font-medium text-red-700">Deleted</span></>;
      default: return null;
    }
  };

  const filteredUsers = users
    .filter(user => roleFilter === 'All' || user.role.toLowerCase() === roleFilter.toLowerCase())
    .filter(user => statusFilter === 'All' || user.status === statusFilter)
    .filter(user => user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;

  return (
    <div>
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-lg text-display-lg text-on-background">User Management</h1>
          <p className="text-body-lg text-on-surface-variant">Review, manage, and moderate your platform's user base.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
        <div className="bg-indigo-50 border border-indigo-100 p-md rounded-xl flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-600">groups</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Users</p>
            <h3 className="text-xl font-bold text-on-surface">{users.length}</h3>
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 p-md rounded-xl flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Active Users</p>
            <h3 className="text-xl font-bold text-on-surface">{users.filter(u => u.status === 'Active').length}</h3>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 p-md rounded-xl flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-600">gavel</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Suspended Users</p>
            <h3 className="text-xl font-bold text-on-surface">{users.filter(u => u.status === 'Suspended').length}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-outline-variant rounded-xl p-md mb-xl flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-md w-full md:w-auto flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">filter_alt</span>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none bg-surface border border-outline-variant rounded-lg pl-10 pr-10 py-2 text-body-md font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Student">Student</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Working Professional">Working Professional</option>
            </select>
            <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none bg-surface border border-outline-variant rounded-lg pl-md pr-10 py-2 text-body-md font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="All">Any</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Deleted">Deleted</option>
            </select>
            <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>

        <div className="flex items-center gap-md">
          <button
            onClick={() => { setRoleFilter('All'); setStatusFilter('All'); setSearchQuery(''); }}
            className="text-primary font-label-md hover:underline shrink-0"
          >
            Clear all filters
          </button>
          <div className="h-5 w-px bg-outline-variant mx-xs"></div>
          <span className="text-body-md text-on-surface-variant">
            Showing {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length}
          </span>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && role !== 'developer' && (
        <div className="bg-primary-container text-on-primary-container px-lg py-md rounded-xl flex items-center justify-between mb-lg animate-in fade-in slide-in-from-top-4">
          <span className="font-label-md font-semibold">{selectedUsers.size} users selected</span>
          <div className="flex items-center gap-md">
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-md py-sm bg-surface text-on-surface shadow-sm hover:bg-surface-container-low rounded-lg font-label-md transition-colors flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Cancel Selection
            </button>
            <div className="h-6 w-px bg-on-primary-container/20 mx-xs"></div>
            <button
              onClick={() => setBulkEmailModalOpen(true)}
              className="px-md py-sm bg-surface text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Send Bulk Warning
            </button>
            <button
              onClick={() => setSuspendConfirmModalOpen(true)}
              className="px-md py-sm bg-error text-on-error rounded-lg font-label-md hover:bg-error/90 transition-colors shadow-sm flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              Suspend Selected
            </button>
          </div>
        </div>
      )}

      {/* User List View */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                {role !== 'developer' && (
                  <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider w-12">
                    <input
                      className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                        else setSelectedUsers(new Set());
                      }}
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    />
                  </th>
                )}
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider">User</th>
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider">Role</th>
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider">Status</th>
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {currentUsers.map(user => (
                <tr key={user.id} className="data-row hover:bg-surface-container-low transition-colors group">
                  {role !== 'developer' && (
                    <td className="px-lg py-md">
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                      />
                    </td>
                  )}
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-variant text-on-surface-variant font-semibold text-body-sm flex-shrink-0">
                        {user.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{user.name}</span>
                        <span className="text-body-sm text-outline">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-lg py-md">
                    <span className={`px-sm py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${getRoleClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-xs">
                      {getStatusDisplay(user.status)}
                    </div>
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-sm">
                      {role !== 'developer' && (
                        <>
                          <button
                            onClick={() => { setUserToWarn(user); setWarningModalOpen(true); }}
                            className="p-xs text-outline hover:text-orange-500 transition-colors hover:bg-orange-50 rounded-lg"
                            title="Send Warning"
                          >
                            <span className="material-symbols-outlined text-[20px]">warning</span>
                          </button>
                          {user.status === 'Suspended' ? (
                            <button
                              onClick={() => handleUnsuspend(user)}
                              className="p-xs text-outline hover:text-green-600 transition-colors hover:bg-green-50 rounded-lg"
                              title="Unsuspend User"
                            >
                              <span className="material-symbols-outlined text-[20px]">undo</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => { setUserToSuspend(user); setSuspendConfirmModalOpen(true); }}
                              className="p-xs text-outline hover:text-error transition-colors hover:bg-error-container/50 rounded-lg"
                              title="Suspend User"
                            >
                              <span className="material-symbols-outlined text-[20px]">gavel</span>
                            </button>
                          )}
                        </>
                      )}
                      <button onClick={() => navigate(`/profile/${user.id}`)} className="p-xs text-outline hover:text-primary transition-colors hover:bg-surface-container rounded-lg" title="View Profile">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-xl py-lg flex flex-col items-center gap-md">
        <p className="text-body-sm text-outline">
          Showing {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0} - {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
        </p>
        <div className="flex items-center gap-xs mt-sm">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-label-md transition-colors ${currentPage === index + 1
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'hover:bg-surface-container-low text-on-surface-variant'
                }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">warning</span>
                Send Warning
              </h3>
              <button onClick={() => setWarningModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">
              You are sending an official warning to <strong>{userToWarn?.name}</strong>. They will receive this warning on the home page.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">REASON</label>
                <select
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option>Inappropriate Behavior</option>
                  <option>Spam / Self-Promotion</option>
                  <option>Harassment</option>
                  <option>Platform Manipulation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">ADDITIONAL MESSAGE (OPTIONAL)</label>
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="Provide any specific context or links to offending content..."
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none h-24"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setWarningModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button
                onClick={handleSendWarning}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm active:scale-95"
              >
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      {bulkEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">warning</span>
                Send Bulk Warning
              </h3>
              <button onClick={() => setBulkEmailModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">
              You are sending an official warning to <strong>{selectedUsers.size} selected users</strong>. They will receive this warning on the home page.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">REASON</label>
                <select
                  value={bulkWarningReason}
                  onChange={(e) => setBulkWarningReason(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option>Inappropriate Behavior</option>
                  <option>Spam / Self-Promotion</option>
                  <option>Harassment</option>
                  <option>Platform Manipulation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">ADDITIONAL MESSAGE (OPTIONAL)</label>
                <textarea
                  value={bulkWarningMessage}
                  onChange={(e) => setBulkWarningMessage(e.target.value)}
                  placeholder="Provide any specific context or links to offending content..."
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none h-24"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setBulkEmailModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button
                onClick={handleSendBulkEmail}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
              >
                Send Warnings
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Suspend Confirmation Modal */}
      {suspendConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[400px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">gavel</span>
                Confirm Suspension
              </h3>
              <button onClick={() => setSuspendConfirmModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">
              {userToSuspend 
                ? <>Are you sure you want to suspend <strong>{userToSuspend.name}</strong>? This will immediately revoke their access to the platform.</>
                : <>Are you sure you want to suspend <strong>{selectedUsers.size}</strong> selected users? This will immediately revoke their access to the platform.</>
              }
            </p>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setSuspendConfirmModalOpen(false); setUserToSuspend(null); }} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button
                onClick={handleSuspend}
                className="bg-error text-on-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 transition-colors shadow-sm active:scale-95"
              >
                Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
