#!/bin/bash
echo "🔄 حذف الحاوية والصور القديمة..."
docker compose down -v

echo "🧹 تنظيف Docker cache..."
docker system prune -f

echo "🔨 بناء الصورة من جديد (بدون cache)..."
docker compose build --no-cache

echo "🚀 تشغيل الحاوية..."
docker compose up -d

echo ""
echo "✅ تم البناء بنجاح!"
echo ""
echo "⚠️  مهم: امسح cache المتصفح أو استخدم Incognito Mode لرؤية التحديثات"
echo "   - Chrome/Edge: Ctrl+Shift+Delete (Windows) أو Cmd+Shift+Delete (Mac)"
echo "   - أو استخدم: Ctrl+F5 (Windows) أو Cmd+Shift+R (Mac) لإعادة تحميل قوي"
echo ""
echo "📋 لعرض السجلات:"
echo "   docker compose logs -f app"
