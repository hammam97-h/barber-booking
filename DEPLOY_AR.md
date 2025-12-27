# نشر نظام حجز مواعيد الحلاق (مجاني)

هذا المشروع **Full‑Stack** (React + Express/tRPC) ويحتاج **قاعدة بيانات MySQL**.

أفضل خيار مجاني/سهل (حالياً):
- **Render** لاستضافة السيرفر (خطة مجانية)
- **TiDB Cloud Starter** لقاعدة بيانات MySQL (حصة مجانية)

> ملاحظة: الاستضافة المجانية مناسبة للتجربة والهواية.

---

## 1) جهّز قاعدة البيانات (TiDB Cloud)

1. أنشئ Cluster من نوع **TiDB Cloud Starter**.
2. من صفحة الـ Cluster اضغط **Connect** وخذ **connection string**.

سيكون شبيه بهذا:

```text
mysql://USER:PASSWORD@HOST:4000/DATABASE
```

> TiDB Cloud يستخدم منفذ 4000 غالباً (حسب صفحة Connect).

---

## 2) انشر على Render

### الطريقة الأسرع (Render Blueprint)
1. ارفع المشروع على GitHub.
2. في Render اختر **New +** ثم **Blueprint** واختر الريبو.
3. Render سيقرأ ملف `render.yaml` ويبني ويشغل المشروع.

### إعداد المتغيرات (Environment Variables)
من داخل خدمة Render:
- `DATABASE_URL` = connection string من TiDB Cloud
- `JWT_SECRET` = أي نص طويل وعشوائي

> يوجد متغير `MIGRATE_ON_START=1` افتراضياً وسيشغّل `pnpm db:push` عند الإقلاع لتطبيق الجداول.

---

## 3) اختبار سريع بعد النشر

- افتح رابط Render.
- جرّب تسجيل الدخول بحساب جديد.
- أول مستخدم ينشأ في النظام يصبح **admin** تلقائياً.

---

## تشغيل محلي (اختياري)

```bash
pnpm install
cp .env.example .env
# ضع DATABASE_URL
pnpm db:push
pnpm dev
```
