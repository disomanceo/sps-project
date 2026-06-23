import { Download, Printer } from 'lucide-react';
import React from 'react';
import { PageHeader } from '../components/PageHeader.jsx';

export function Reports() {
  return (
    <>
      <PageHeader
        title="รายงาน"
        description="ศูนย์รวมรายงานโครงการ งบประมาณ และเอกสารสำหรับผู้บริหาร"
        action={<button className="primary-btn"><Printer size={16} /> พิมพ์ PDF</button>}
      />
      <section className="report-grid">
        {['รายงานสรุปโครงการ', 'รายงานรับ-จ่าย', 'รายงานเงินคงเหลือ', 'รายงานตามฝ่ายงาน'].map((item) => (
          <article className="panel report-card" key={item}>
            <Download size={22} />
            <strong>{item}</strong>
            <span>พร้อมส่งออก PDF / Excel ในขั้นพัฒนาถัดไป</span>
          </article>
        ))}
      </section>
    </>
  );
}
