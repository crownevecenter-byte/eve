// frontend/src/pages/dashboards/branch/POS.jsx
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { Icon } from "../../../components/branch/BranchShared";
import { Package, Search, Plus, X, MessageCircle, Home, FileText, Calendar, Edit2, Trash2 } from "lucide-react";
import "../../../styles/pos.css";

// Import Modular Components
import AddCustomer from './pos/AddCustomer';
import AddAccount from './pos/AddAccount';
import PaymentVoucher from './pos/PaymentVoucher';
import ReceiptVoucher from './pos/ReceiptVoucher';
import JournalVoucher from './pos/JournalVoucher';
import ViewVoucher from './pos/ViewVoucher';
import SaleInvoices from './pos/SaleInvoices';
import PurchaseInvoices from './pos/PurchaseInvoices';
import ServiceInvoices from './pos/ServiceInvoices';
import AccountLedger from './pos/AccountLedger';
import DebitTrailBalance from './pos/DebitTrailBalance';
import ServiceThermalReceipt, { normalizeServiceBooking } from '../../../components/branch/ServiceThermalReceipt';
import SaleInvoiceReceipt from '../../../components/branch/SaleInvoiceReceipt';

const MOBILE_BREAKPOINT = 1024;

const POS = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeMenu, setActiveMenu] = useState("sale-invoices");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > MOBILE_BREAKPOINT);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      setSidebarOpen(mobile ? false : true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isSidebarOpen]);

  // Print/Receipt State
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [serviceReceiptData, setServiceReceiptData] = useState(null);

  const menuGroups = [
    {
      title: "GENERAL",
      items: [
        { id: "add-customer", label: "Add Customer", icon: "user" },
        { id: "add-account", label: "Add Account", icon: "dollar" },
      ]
    },
    {
      title: "VOUCHERS",
      items: [
        { id: "payment-voucher", label: "Payment Voucher", icon: "orders" },
        { id: "receipt-voucher", label: "Receipt Voucher", icon: "plus" },
        { id: "journal-voucher", label: "Journal Voucher", icon: "settings" },
        { id: "view-voucher", label: "View Voucher", icon: "search" },
      ]
    },
    {
      title: "INVOICES",
      items: [
        { id: "sale-invoices", label: "Sale Invoices", icon: "tag" },
        { id: "purchase-invoices", label: "Purchase Invoices", icon: "truck" },
        { id: "service-invoices", label: "Service Invoices", icon: "wrench" },
      ]
    },
    {
      title: "REPORTS",
      items: [
        { id: "account-ledger", label: "Account Ledger", icon: "reports" },
        { id: "debit-trail", label: "Detailed Trial Balance", icon: "reports" },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "add-customer":
        return <AddCustomer user={user} />;
      case "add-account":
        return <AddAccount user={user} />;
      case "payment-voucher":
        return <PaymentVoucher user={user} />;
      case "receipt-voucher":
        return <ReceiptVoucher user={user} />;
      case "journal-voucher":
        return <JournalVoucher user={user} />;
      case "view-voucher":
        return <ViewVoucher user={user} />;
      case "sale-invoices":
        return <SaleInvoices user={user} queryClient={queryClient} onInvoiceGenerated={setGeneratedInvoice} />;
      case "purchase-invoices":
        return <PurchaseInvoices user={user} queryClient={queryClient} />;
      case "service-invoices":
        return <ServiceInvoices user={user} queryClient={queryClient} onPrintReceipt={(item, type) => setServiceReceiptData({ item, type })} />;
      case "account-ledger":
        return <AccountLedger user={user} />;
      case "debit-trail":
        return <DebitTrailBalance user={user} />;
      default:
        return <div className="card ci"><h2>{activeMenu.replace("-", " ").toUpperCase()}</h2><p>Feature coming soon...</p></div>;
    }
  };

  const handleMenuSelect = (menuId) => {
    setActiveMenu(menuId);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="pos-shell">
      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div
          className={`sidebar-overlay ${isSidebarOpen ? "show" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!isSidebarOpen}
        />
      )}

      {/* POS Sidebar */}
      <div
        className={`pos-sidebar ${isMobile ? (isSidebarOpen ? "open" : "") : "pos-sidebar--desktop"}`}
        aria-hidden={isMobile && !isSidebarOpen}
      >
        <div className="pos-brand">
          <div className="pos-logo-box">CE</div>
          <div className="pos-brand-text">
            <div className="pos-brand-name">
              <span className="dark">CROWN</span>
              <span className="orange">EVE</span>
            </div>
            <div className="pos-brand-sub">BRANCH TERMINAL</div>
          </div>
          {/* Mobile Close Button */}
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
            <Icon n="close" size={20} />
          </button>
        </div>

        <div className="pos-menu-scroll">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="pos-menu-group">
              <div className="pos-menu-group-title">{group.title}</div>
              {group.items.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleMenuSelect(item.id)}
                  className={`pos-menu-item ${activeMenu === item.id ? "active" : ""}`}
                >
                  <Icon n={item.icon} size={16} className="icon" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="pos-user-card">
          <div className="user-avatar">B</div>
          <div className="user-info">
            <span className="user-name">Branch Owner</span>
            <span className="user-role">Local Station</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pos-main">
        <header className="pos-header">
          <div className="pos-header-left">
            {isMobile && (
              <button
                type="button"
                className="btn-ico pos-menu-toggle"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Icon n="menu" size={20} />
              </button>
            )}
            <div className="pos-header-title">
              {activeMenu.replace(/-/g, " ")}
            </div>
          </div>
          
          <div className="pos-header-actions">
            <div className="status-pill">
              <span className="status-dot" /> <span>Live Status</span>
            </div>
            <button className="btn-quick-pos">
              <Icon n="plus" size={14} /> <span>Quick POS</span>
            </button>
            <div className="station-badge">
              <span className="status-dot" style={{ color: '#4CAF50' }} /> <span>Station Active</span>
            </div>
          </div>
        </header>

        <main className="pos-content">
          {renderContent()}
        </main>
      </div>
      {generatedInvoice && (
        <SaleInvoiceReceipt
          order={generatedInvoice}
          branchName={user?.branchName}
          issuedBy={user?.name}
          onClose={() => setGeneratedInvoice(null)}
        />
      )}
      {serviceReceiptData && (
        <ServiceThermalReceipt
          type={serviceReceiptData.type}
          booking={normalizeServiceBooking(serviceReceiptData.item, user)}
          onClose={() => setServiceReceiptData(null)}
        />
      )}
    </div>
  );
};

export default POS;
