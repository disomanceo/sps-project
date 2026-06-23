import React from 'react';

const statusClass = {
  draft: 'gray',
  'แบบร่าง': 'gray',
  active: 'blue',
  'กำลังดำเนินการ': 'blue',
  'ดำเนินการ': 'blue',
  pending: 'amber',
  'รออนุมัติ': 'amber',
  approved: 'green',
  'อนุมัติแล้ว': 'green',
  done: 'green',
  'เสร็จสิ้น': 'green',
  not_started: 'gray',
  'ยังไม่เริ่ม': 'gray',
  cancelled: 'gray',
  'ยกเลิก': 'gray'
};

const statusLabel = {
  draft: 'แบบร่าง',
  active: 'ดำเนินการ',
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  done: 'เสร็จสิ้น',
  not_started: 'ยังไม่เริ่ม',
  cancelled: 'ยกเลิก'
};

export function ProjectStatus({ value }) {
  return <span className={`status-pill ${statusClass[value] ?? 'gray'}`}>{statusLabel[value] ?? value}</span>;
}
