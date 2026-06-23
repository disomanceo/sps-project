import React from 'react';
import { PageHeader } from '../components/PageHeader.jsx';

export function Settings() {
  return (
    <>
      <PageHeader
        title="ตั้งค่าระบบ"
        description="ข้อมูลสถานศึกษา สีระบบ ปีงบประมาณ และกลุ่มผู้ใช้งาน"
      />
      <section className="panel form-panel">
        <div className="form-grid">
          <label>
            <span>ชื่อสถานศึกษา</span>
            <input defaultValue="โรงเรียน สพฐ. วงจรสมบูรณ์" />
          </label>
          <label>
            <span>ปีงบประมาณปัจจุบัน</span>
            <input defaultValue="2569" />
          </label>
          <label>
            <span>สีหลัก</span>
            <input type="color" defaultValue="#4f46e5" />
          </label>
          <label>
            <span>สีรอง</span>
            <input type="color" defaultValue="#10b981" />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-btn">บันทึกการตั้งค่า</button>
        </div>
      </section>
    </>
  );
}
