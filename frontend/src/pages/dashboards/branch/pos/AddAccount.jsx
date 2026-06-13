// frontend/src/pages/dashboards/branch/pos/AddAccount.jsx
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api';
import { useAccountsPageInit } from '../../../../hooks/useAccountsPageInit';
import { Icon } from '../../../../components/branch/BranchShared';
import { FolderPlus, UserPlus, Trash2, Edit3, CheckCircle, XCircle, Plus, RefreshCw, Layers, DollarSign } from 'lucide-react';
import './AddAccount.css';

const AddAccount = ({ user }) => {
  const queryClient = useQueryClient();

  const formatBalance = (bal, categoryName) => {
    if (bal === undefined || bal === null) return 'PKR 0';
    const catName = (categoryName || '').toLowerCase();
    
    const isDebitNature = 
      catName.includes('bank') ||
      catName.includes('cash') ||
      catName.includes('asset') ||
      catName.includes('expense') ||
      catName.includes('customer') ||
      catName.includes('purchase');

    let type = '';
    if (bal === 0) {
      return 'PKR 0';
    }

    if (isDebitNature) {
      type = bal > 0 ? 'Dr' : 'Cr';
    } else {
      type = bal > 0 ? 'Cr' : 'Dr';
    }

    return `PKR ${Math.abs(bal).toLocaleString()}${type ? ' ' + type : ''}`;
  };

  // Selected category filter
  const [selectedCatId, setSelectedCatId] = useState('ALL');

  // Category Form State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // Account Form State
  const [showAccModal, setShowAccModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accForm, setAccForm] = useState({ account_name: '', categoryId: '', opening_balance: 0 });

  const { data: pageInit, isLoading: loadingPageInit, refetch: refetchPageInit } = useAccountsPageInit(user?.branchId);
  const loadingCategories = loadingPageInit;
  const loadingAccounts = loadingPageInit;
  const refetchCategories = refetchPageInit;
  const refetchAccounts = refetchPageInit;

  const categories = pageInit?.categories?.data || [];
  const accounts = pageInit?.accounts?.data || [];

  // Category Actions
  const handleOpenCatModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({ name: cat.name, description: cat.description || '' });
    } else {
      setEditingCategory(null);
      setCatForm({ name: '', description: '' });
    }
    setShowCatModal(true);
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return alert("Category name is required");

    try {
      if (editingCategory) {
        await api.put(`/accounts/categories/${editingCategory.id}`, catForm);
        alert("Account category updated successfully!");
      } else {
        await api.post('/accounts/categories', {
          ...catForm,
          branchId: user?.branchId
        });
        alert("Account category created successfully!");
      }
      setShowCatModal(false);
      setCatForm({ name: '', description: '' });
      setEditingCategory(null);
      refetchCategories();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCatDelete = async (catId) => {
    if (window.confirm("Are you sure you want to delete this category? All sub-accounts might be affected.")) {
      try {
        await api.delete(`/accounts/categories/${catId}`);
        alert("Category deleted successfully.");
        if (selectedCatId === catId) setSelectedCatId('ALL');
        refetchCategories();
        refetchAccounts();
      } catch (err) {
        alert("Error: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // Account Actions
  const handleOpenAccModal = (acc = null) => {
    if (acc) {
      setEditingAccount(acc);
      setAccForm({
        account_name: acc.account_name,
        categoryId: acc.categoryId,
        opening_balance: acc.opening_balance
      });
    } else {
      setEditingAccount(null);
      setAccForm({
        account_name: '',
        categoryId: selectedCatId !== 'ALL' ? selectedCatId : (categories[0]?.id || ''),
        opening_balance: 0
      });
    }
    setShowAccModal(true);
  };

  const handleAccSubmit = async (e) => {
    e.preventDefault();
    if (!accForm.account_name.trim()) return alert("Account name is required");
    if (!accForm.categoryId) return alert("Please select a category");

    try {
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, {
          account_name: accForm.account_name,
          categoryId: accForm.categoryId
        });
        alert("Account updated successfully!");
      } else {
        await api.post('/accounts', {
          ...accForm,
          branchId: user?.branchId
        });
        alert("Account & Auto-Ledger created successfully!");
      }
      setShowAccModal(false);
      setAccForm({ account_name: '', categoryId: '', opening_balance: 0 });
      setEditingAccount(null);
      refetchAccounts();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleAccountStatus = async (acc) => {
    const newStatus = acc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/accounts/${acc.id}`, {
        status: newStatus
      });
      alert(`Account has been marked ${newStatus}`);
      refetchAccounts();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAccDelete = async (accId) => {
    if (window.confirm("Are you sure you want to permanently delete this account?")) {
      try {
        await api.delete(`/accounts/${accId}`);
        alert("Account deleted successfully.");
        refetchAccounts();
      } catch (err) {
        alert("Error: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // Filter accounts
  const filteredAccounts = selectedCatId === 'ALL'
    ? accounts
    : accounts.filter(acc => acc.categoryId === selectedCatId);

  return (
    <div className="add-account-view-container flex flex-col lg:flex-row gap-8 p-1">
      {/* STEP 1: Categories Side Panel */}
      <div className="lg:w-1/3 bg-white p-6 rounded-[2.5rem] border border-[#F3E5DC] shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#F3E5DC]">
          <div>
            <span className="text-[9px] font-black text-[#E65100] uppercase tracking-widest">Step 01</span>
            <h3 className="text-lg font-black text-[#2D1A12] uppercase tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-[#E65100]" /> Categories
            </h3>
          </div>
          <button
            onClick={() => handleOpenCatModal()}
            className="w-10 h-10 bg-[#FFF6F0] border border-[#F3E5DC] text-[#E65100] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
            title="Create Category"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 max-h-[60vh] pr-2 custom-scrollbar">
          <div
            onClick={() => setSelectedCatId('ALL')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${selectedCatId === 'ALL' ? 'bg-[#2D1A12] text-white border-transparent shadow-lg' : 'bg-[#FFFAF8] border-[#F3E5DC] text-[#2D1A12] hover:bg-[#FFF6F0]'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase">All Categories</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-xs">
              {accounts.length}
            </span>
          </div>

          {loadingCategories ? (
            <div className="py-8 text-center text-[#8D7A71] text-xs font-bold animate-pulse">Loading Categories...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-[#8D7A71] text-xs font-bold border border-dashed border-[#F3E5DC] rounded-2xl bg-[#FFFAF8]">
              No categories configured
            </div>
          ) : (
            categories.map(cat => {
              const catAccs = accounts.filter(a => a.categoryId === cat.id);
              const isSelected = selectedCatId === cat.id;
              
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 relative group ${isSelected ? 'bg-[#E65100] text-white border-transparent shadow-lg shadow-[#E65100]/25' : 'bg-[#FFFAF8] border-[#F3E5DC] text-[#2D1A12] hover:bg-[#FFF6F0]'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">{cat.name}</h4>
                      {cat.description && (
                        <p className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#8D7A71]'}`}>
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[#FFF6F0] text-[#E65100]'}`}>
                        {catAccs.length} accounts
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 border-t pt-2 mt-1 border-dashed border-current/10">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenCatModal(cat); }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white border border-[#F3E5DC] text-[#8D7A71] hover:text-[#E65100]'}`}
                      title="Edit Category"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCatDelete(cat.id); }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white border border-[#F3E5DC] text-[#8D7A71] hover:text-red-500'}`}
                      title="Delete Category"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* STEP 2: Accounts Inside Selected Category */}
      <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-[#F3E5DC] shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#F3E5DC]">
          <div>
            <span className="text-[9px] font-black text-[#E65100] uppercase tracking-widest">Step 02</span>
            <h3 className="text-xl font-black text-[#2D1A12] uppercase tracking-tight flex items-center gap-2">
              <DollarSign size={20} className="text-[#E65100]" /> 
              {selectedCatId === 'ALL' ? 'Registered Accounts' : `${categories.find(c => c.id === selectedCatId)?.name || 'Category'} Accounts`}
            </h3>
          </div>
          <button
            onClick={() => handleOpenAccModal()}
            className="w-full sm:w-auto bg-[#E65100] text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-[#E65100]/20 hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Register New Account
          </button>
        </div>

        {loadingAccounts ? (
          <div className="flex-1 flex items-center justify-center py-20 text-[#8D7A71] font-bold animate-pulse text-sm">
            Fetching account hierarchies...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-[#FFFAF8] rounded-[2rem] border border-dashed border-[#F3E5DC]">
            <span className="text-3xl mb-3">💼</span>
            <h4 className="font-black text-[#2D1A12] uppercase text-xs tracking-wider">No accounts created in this segment</h4>
            <p className="text-[10px] text-[#8D7A71] mt-1 max-w-xs uppercase">Please create a child account to initialize its corresponding ledger book automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F3E5DC] text-[9px] font-black text-[#8D7A71] uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Account Name & Category</th>
                  <th className="px-6 py-4 text-right">Opening Balance</th>
                  <th className="px-6 py-4 text-right">Current Balance</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Ledger Sync</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(acc => {
                  const isActive = acc.status === 'ACTIVE';
                  return (
                    <tr key={acc.id} className="border-b border-[#F3E5DC] last:border-none hover:bg-[#FFFAF8]/60 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-black text-xs text-[#2D1A12] uppercase">{acc.account_name}</div>
                        <div className="text-[9px] font-bold text-[#8D7A71] uppercase tracking-wider mt-0.5">
                          Category: {acc.category?.name}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-xs text-[#8D7A71]">
                        {formatBalance(acc.opening_balance, acc.category?.name)}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-xs text-[#E65100]">
                        {formatBalance(acc.current_balance, acc.category?.name)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                          <CheckCircle size={12} /> Auto-Linked
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenAccModal(acc)}
                            className="w-8 h-8 bg-white border border-[#F3E5DC] text-[#8D7A71] hover:text-[#E65100] rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                            title="Edit Account"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleAccDelete(acc.id)}
                            className="w-8 h-8 bg-white border border-[#F3E5DC] text-[#8D7A71] hover:text-red-600 rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                            title="Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            onClick={() => toggleAccountStatus(acc)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-all bg-white border border-[#F3E5DC] ${isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                            title={isActive ? "Deactivate Account" : "Activate Account"}
                          >
                            {isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CATEGORY FORM MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCatModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
            <header className="px-8 py-5 border-b border-[#F3E5DC] flex justify-between items-center bg-[#FFFAF8]">
              <div>
                <h3 className="text-md font-black text-[#2D1A12] uppercase tracking-tight">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </h3>
                <p className="text-[9px] font-bold text-[#8D7A71] uppercase tracking-[0.2em] mt-0.5">Parent Account Group</p>
              </div>
              <button
                className="w-8 h-8 bg-white border border-[#F3E5DC] rounded-full flex items-center justify-center text-[#8D7A71] hover:bg-[#F3E5DC] transition-all"
                onClick={() => setShowCatModal(false)}
              >
                <Icon n="close" size={16} />
              </button>
            </header>

            <form onSubmit={handleCatSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Category Name *</label>
                <input
                  required
                  type="text"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Bank, Cash, Expenses"
                  className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Description</label>
                <textarea
                  value={catForm.description}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Short description of this accounting type..."
                  className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-xs min-h-[80px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E65100] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#E65100]/20 hover:scale-[1.01] active:scale-95 transition-all mt-4"
              >
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT FORM MODAL */}
      {showAccModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAccModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
            <header className="px-8 py-5 border-b border-[#F3E5DC] flex justify-between items-center bg-[#FFFAF8]">
              <div>
                <h3 className="text-md font-black text-[#2D1A12] uppercase tracking-tight">
                  {editingAccount ? 'Update Account' : 'Register Account'}
                </h3>
                <p className="text-[9px] font-bold text-[#8D7A71] uppercase tracking-[0.2em] mt-0.5">Auto-Provisions Ledger</p>
              </div>
              <button
                className="w-8 h-8 bg-white border border-[#F3E5DC] rounded-full flex items-center justify-center text-[#8D7A71] hover:bg-[#F3E5DC] transition-all"
                onClick={() => setShowAccModal(false)}
              >
                <Icon n="close" size={16} />
              </button>
            </header>

            <form onSubmit={handleAccSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Account Category *</label>
                <select
                  required
                  value={accForm.categoryId}
                  onChange={e => setAccForm({ ...accForm, categoryId: e.target.value })}
                  className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-xs"
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Account Name *</label>
                <input
                  required
                  type="text"
                  value={accForm.account_name}
                  onChange={e => setAccForm({ ...accForm, account_name: e.target.value })}
                  placeholder="e.g. Meezan Bank, Petty Cash"
                  className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-xs"
                />
              </div>

              {!editingAccount && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Opening Balance (PKR)</label>
                  <input
                    type="number"
                    value={accForm.opening_balance}
                    onChange={e => setAccForm({ ...accForm, opening_balance: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter starting balance"
                    className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-xs"
                  />
                  <p className="text-[8px] text-[#8D7A71] uppercase tracking-wider font-bold ml-1">
                    System will automatically post a corresponding opening debit/credit entry to the new ledger.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#E65100] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#E65100]/20 hover:scale-[1.01] active:scale-95 transition-all mt-4"
              >
                {editingAccount ? 'Update Account' : 'Register Account & Ledger'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAccount;
