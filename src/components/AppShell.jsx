import {
  BarChart3,
  ClipboardList,
  FilePlus2,
  Landmark,
  Menu,
  PanelLeftClose,
  ReceiptText,
  Settings,
  X
} from 'lucide-react';
import React, { useState } from 'react';

const navItems = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: BarChart3 },
  { id: 'projects', label: 'โครงการ', icon: ClipboardList },
  { id: 'form', label: 'เพิ่มโครงการ', icon: FilePlus2 },
  { id: 'finance', label: 'การเงิน', icon: Landmark },
  { id: 'reports', label: 'รายงาน', icon: ReceiptText },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings }
];

export function AppShell({ activePage, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navigate = (page) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">ส</div>
          <div className="brand-copy">
            <strong>ระบบบริหารโครงการ</strong>
            <span>งบประมาณสถานศึกษา</span>
          </div>
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(false)} aria-label="ปิดเมนู">
            <X size={20} />
          </button>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                key={item.id}
                onClick={() => navigate(item.id)}
                title={item.label}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="collapse-btn desktop-only" onClick={() => setCollapsed((value) => !value)}>
          <PanelLeftClose size={18} />
          <span>{collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}</span>
        </button>
      </aside>

      <div className="mobile-scrim" onClick={() => setSidebarOpen(false)} />

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(true)} aria-label="เปิดเมนู">
            <Menu size={22} />
          </button>
          <div>
            <p className="eyebrow">SPS Project Finance</p>
            <h1>ระบบบริหารโครงการและงบประมาณสถานศึกษา</h1>
          </div>
          <button className="ghost-btn">ปีงบประมาณ 2569</button>
        </header>

        <section className="content">{children}</section>
      </main>

      <nav className="bottom-nav">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activePage === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => navigate(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
