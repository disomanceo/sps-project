import React from 'react';

const statusClass = {
  'ยังไม่เริ่ม': 'gray',
  'ดำเนินการ': 'blue',
  'เสร็จสิ้น': 'green',
  'ยกเลิก': 'gray'
};

export function ProjectStatus({ value }) {
  return <span className={`status-pill ${statusClass[value] ?? 'gray'}`}>{value || 'ยังไม่เริ่ม'}</span>;
}
