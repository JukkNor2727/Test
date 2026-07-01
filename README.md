# Drive Data Website

เว็บตัวอย่างสำหรับเก็บข้อมูลโดยใช้ GitHub Pages เป็นหน้าเว็บ และใช้ Google Drive / Google Sheets ผ่าน Google Apps Script เป็นฐานเก็บข้อมูล

## โครงสร้างระบบ

```text
Browser / GitHub Pages
        ↓
Google Apps Script Web App
        ↓
Google Sheets file in Google Drive
```

> หมายเหตุ: GitHub Pages เป็น static website จึงเขียนข้อมูลลง Google Drive โดยตรงไม่ได้ ต้องมี Google Apps Script เป็น backend ตัวกลาง

## ไฟล์สำคัญ

- `index.html` หน้าเว็บหลัก
- `styles.css` สไตล์ของเว็บ
- `app.js` ตัวเชื่อมหน้าเว็บกับ Apps Script
- `google-apps-script/Code.gs` โค้ด backend สำหรับ Google Apps Script
- `.github/workflows/pages.yml` workflow สำหรับ deploy GitHub Pages

## วิธีตั้งค่า Google Drive Database

### 1) สร้าง Google Apps Script

1. เข้า Google Drive
2. กด `New` > `More` > `Google Apps Script`
3. ลบโค้ดเดิมในไฟล์ `Code.gs`
4. คัดลอกโค้ดจากไฟล์ `google-apps-script/Code.gs` ใน repo นี้ไปวาง
5. กด Save

### 2) Deploy เป็น Web App

1. กด `Deploy` > `New deployment`
2. เลือกชนิดเป็น `Web app`
3. ตั้งค่า
   - Execute as: `Me`
   - Who has access: `Anyone`
4. กด `Deploy`
5. อนุญาตสิทธิ์ Google ตามที่ระบบขอ
6. คัดลอก `Web app URL` ที่ลงท้ายด้วย `/exec`

### 3) เชื่อม URL กับหน้าเว็บ

1. เปิดหน้าเว็บจาก GitHub Pages
2. ไปที่หัวข้อ `ตั้งค่าฐานข้อมูล`
3. วาง `Apps Script Web App URL`
4. กด `บันทึก URL`
5. ทดสอบเพิ่มข้อมูล 1 รายการ

Apps Script จะสร้าง Google Sheets ชื่อ `Drive Data Website Database` ใน Google Drive ให้อัตโนมัติ และใช้ sheet ชื่อ `records` เป็นตารางเก็บข้อมูล

## วิธีเปิด GitHub Pages

ถ้า workflow ยังไม่ทำงาน ให้เปิดใน GitHub:

1. เข้า repo นี้
2. ไปที่ `Settings` > `Pages`
3. เลือก Source เป็น `GitHub Actions`
4. รอ workflow deploy เสร็จ

หลัง deploy เสร็จ เว็บจะเปิดได้ที่:

```text
https://jukknor2727.github.io/Test/
```

## ข้อมูลที่เก็บใน Google Sheets

| column | ความหมาย |
|---|---|
| id | รหัสรายการอัตโนมัติ |
| title | ชื่อรายการ |
| category | หมวดหมู่ |
| owner | ผู้รับผิดชอบ |
| status | สถานะ |
| description | รายละเอียด |
| createdAt | วันที่สร้าง |
| updatedAt | วันที่อัปเดต |

## คำเตือนเรื่องความปลอดภัย

ถ้าตั้ง Apps Script เป็น `Anyone` ทุกคนที่มี URL สามารถส่งข้อมูลเข้า sheet ได้ จึงไม่ควรใช้เก็บข้อมูลลับ เช่น รหัสผ่าน ข้อมูลบัตร หรือข้อมูลส่วนบุคคลสำคัญ

ถ้าต้องการใช้งานจริง แนะนำให้เพิ่มอย่างน้อย 1 อย่าง:

- token ลับสำหรับตรวจสิทธิ์ก่อนบันทึกข้อมูล
- จำกัดสิทธิ์เฉพาะบัญชี Google ในองค์กร
- เพิ่มหน้า admin แยกต่างหาก
- เพิ่มระบบแก้ไข/ลบข้อมูลพร้อมการยืนยันตัวตน

## ปรับแต่งต่อได้

ระบบนี้เหมาะสำหรับต่อยอดเป็น:

- เว็บเก็บคะแนนนักเรียน
- เว็บบันทึกงาน/โปรเจกต์
- เว็บเก็บข้อมูลลูกค้าเบื้องต้น
- เว็บฟอร์มแจ้งงาน
- เว็บระบบ inventory ขนาดเล็ก
