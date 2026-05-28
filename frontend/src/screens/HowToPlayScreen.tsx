import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Button from '../components/Button';
import { Colors, Font, Spacing, Radius } from '../theme';

const sections = [
  {
    title: '🎯 هدف بازی',
    body: 'با هم‌بازی‌هایت در یک شبکه‌ی محلی Wi-Fi، با حرفی که تصادفی انتخاب می‌شود، باید برای هر دسته (نام، فامیل، شهر، …) یک کلمه بنویسی. کسی که سریع‌تر و یکتاتر بنویسد، بیشتر امتیاز می‌گیرد.',
  },
  {
    title: '📡 راه‌اندازی',
    body:
      '۱) همه به یک Wi-Fi خانگی وصل شوید (اینترنت لازم نیست).\n' +
      '۲) یک نفر «میزبانی» را بزند.\n' +
      '۳) بقیه «پیوستن» را بزنند و میزبان را از لیست انتخاب کنند.\n' +
      '۴) وقتی همه آماده شدند، میزبان «شروع مسابقه» را می‌زند.',
  },
  {
    title: '⏱️ روند هر دور',
    body:
      '• یک حرف تصادفی نمایش داده می‌شود.\n' +
      '• تایمر شمارش معکوس شروع می‌شود.\n' +
      '• برای هر دسته یک کلمه با آن حرف بنویس.\n' +
      '• هر کس زودتر تمام کرد، دکمه‌ی «🛑 استوپ» را می‌زند.\n' +
      '• بعد از استوپ، چند ثانیه فرصت است تا همه پاسخ‌هایشان را نهایی کنند.',
  },
  {
    title: '💯 امتیازدهی',
    body:
      '• پاسخ یکتا (هیچ‌کس دیگری ننوشته): ۱۰ امتیاز\n' +
      '• پاسخ تکراری (یکی دیگر هم نوشته): ۵ امتیاز\n' +
      '• پاسخ نامعتبر یا با حرف اشتباه: ۰ امتیاز',
  },
  {
    title: '🏆 برنده‌ی مسابقه',
    body: 'مسابقه چند دور دارد (در تنظیمات قابل تغییر). در پایان آخرین دور، مجموع امتیازهای همه جمع می‌شود و رتبه‌بندی نهایی نمایش داده می‌شود.',
  },
];

export default function HowToPlayScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>راهنمای بازی</Text>
      {sections.map((s) => (
        <View key={s.title} style={styles.card}>
          <Text style={styles.sTitle}>{s.title}</Text>
          <Text style={styles.sBody}>{s.body}</Text>
        </View>
      ))}
      <Button label="بازگشت" variant="ghost" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.bg, padding: Spacing.lg, gap: Spacing.md },
  h1: { color: Colors.text, fontFamily: Font.bold, fontSize: 24, textAlign: 'center' },
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sTitle: { color: Colors.text, fontFamily: Font.bold, fontSize: 17, textAlign: 'right' },
  sBody: { color: Colors.textMuted, fontFamily: Font.regular, fontSize: 14, lineHeight: 24, textAlign: 'right' },
});
