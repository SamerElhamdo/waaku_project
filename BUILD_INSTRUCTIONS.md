# تعليمات البناء والتحديث

## عند إجراء تحديثات على الكود:

### 1. **تحديث package-lock.json** (إذا أضفت dependencies جديدة):
```bash
npm install
```

### 2. **حذف الحاوية والصور القديمة**:
```bash
docker compose down -v
docker system prune -f
```

### 3. **بناء الصورة من جديد بدون cache**:
```bash
docker compose build --no-cache
```

### 4. **تشغيل الحاوية**:
```bash
docker compose up -d
```

### 5. **مسح cache المتصفح**:
- **Chrome/Edge**: `Ctrl+Shift+Delete` (Windows) أو `Cmd+Shift+Delete` (Mac)
- أو استخدم **Incognito/Private Mode**
- أو اضغط `Ctrl+F5` (Windows) أو `Cmd+Shift+R` (Mac) لإعادة تحميل قوي

### 6. **التحقق من السجلات**:
```bash
docker compose logs -f app
```

## ملاحظات مهمة:

1. **إذا لم تظهر التحديثات**:
   - تأكد من مسح cache المتصفح
   - تأكد من أن البناء تم بدون cache (`--no-cache`)
   - تحقق من السجلات للتأكد من عدم وجود أخطاء

2. **للتحقق من الملفات في الحاوية**:
```bash
docker exec waaku ls -la /usr/src/app/src/app/views/
docker exec waaku ls -la /usr/src/app/dist/
```

3. **لإعادة بناء سريع** (مع cache):
```bash
docker compose build
docker compose up -d
```

4. **لإعادة بناء كامل** (بدون cache):
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

