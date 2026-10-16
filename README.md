# แสงเช้า · คุยกับยายนวล

เว็บไซต์: https://yai-nuan.vercel.app

เว็บแอพให้กำลังใจตอนเช้า คุยแชทกับ "ยายนวล" คุณยายใจดีที่บ้าน

- บอกความรู้สึก 6 แบบ (ใจฟู เหนื่อย กังวล เศร้า เหงา หงุดหงิด) แล้วยายจะเปลี่ยนชุด ท่าทาง และคำปลอบใจตามนั้น
- คำคมกว่า 350 คำ: คำคมประจำเช้า 117 คำ และคำให้กำลังใจตามความรู้สึกอีกอารมณ์ละ 40 คำ คนเดิมจะไม่ได้คำเดิมซ้ำ (จำไว้ในเบราว์เซอร์) จนกว่าจะเห็นครบทุกคำ
- พิมพ์เล่าให้ยายฟังได้ ยายจับความรู้สึกจากคำที่พิมพ์ แล้วให้คำคมที่เข้ากับความรู้สึกตอนนั้น
- ตั้งใจทำเรื่องดี ๆ ให้ตัวเองหนึ่งเรื่อง แล้วกดค้างเพื่อกอดยายก่อนออกจากบ้าน
- แชร์คำยายเป็นการ์ดสตอรี่ 1080×1920 พร้อม QR code สำหรับ Instagram, TikTok และ Facebook

ทั้งแอพอยู่ในไฟล์ `index.html` ไฟล์เดียว (`claude-artifact.html` คือฉบับเดิมสำหรับเปิดใน Claude) บนเว็บนี้ยายตอบจากคำที่เตรียมไว้ทั้งหมด ไม่ใช้ AI ไม่ต้อง build ข้อมูลของผู้ใช้เก็บอยู่ในเบราว์เซอร์ของแต่ละคน (localStorage)

## รันในเครื่อง

```bash
npx serve .
```

## Deploy

เชื่อม repo นี้กับ Vercel ได้เลย (Framework preset: Other, ไม่ต้องตั้ง build command)

## แอพ Android (Play Store)

เว็บนี้เป็น PWA แล้ว (`manifest.json`, `sw.js`, ไอคอนใน `icons/`) จึงห่อเป็นแอพ Android แบบ Trusted Web Activity ได้

1. เข้า https://www.pwabuilder.com ใส่ `https://yai-nuan.vercel.app` แล้วเลือก Package for stores → Android
2. ตั้ง Package ID เช่น `app.vercel.yai_nuan` แล้วดาวน์โหลดไฟล์ `.aab` และ signing key (เก็บ key ไว้ให้ดี ทำหายแล้วอัปเดตแอพไม่ได้)
3. PWABuilder จะให้ไฟล์ `assetlinks.json` มา ให้วางไว้ที่ `.well-known/assetlinks.json` ใน repo นี้ แล้ว push (ถ้าใช้ Play App Signing ให้เพิ่ม SHA-256 จาก Play Console → App integrity ลงในไฟล์ด้วย)
4. อัปโหลด `.aab` ใน Google Play Console
