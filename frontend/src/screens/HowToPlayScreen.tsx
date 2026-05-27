import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';

const sections: { title: string; body: string }[] = [
  {
    title: '۱) شبکه‌ی مشترک',
    body: 'همه‌ی بازیکنان باید روی یک شبکه‌ی Wi-Fi یکسان باشند. اگر در شبکه پیدا نشد، می‌توانید با IP میزبان به‌صورت دستی وصل شوید.',
  },
  {
    title: '۲) میزبان و بازیکن',
    body: 'یکی از دستگاه‌ها «میزبان» می‌شود (سرور محلی را اجرا می‌کند) و بقیه «پیوستن به بازی» را می‌زنند. میزبان هم خودش بازی می‌کند.',
  },
  {
    title: '۳) شروع دور',
    body: 'وقتی همه آماده شدند، میزبان «شروع دور جدید» را می‌زند. یک حرف فارسی به‌صورت تصادفی برای همه نمایش داده می‌شود.',
  },
  {
    title: '۴) پرکردن دسته‌ها',
    body: 'هر بازیکن سعی می‌کند برای دسته‌های نام، فامیل، شهر، کشور، غذا، حیوان، اشیاء و رنگ کلماتی پیدا کند که با حرف انتخاب‌شده شروع می‌شوند.',
  },
  {
    title: '۵) استاپ!',
    body: 'هر بازیکنی (نه فقط میزبان) می‌تواند هر زمان دکمه‌ی استاپ را بزند. با زدن استاپ، دور برای همه پایان می‌یابد و چند ثانیه فرصت می‌ماند تا پاسخ‌های نهایی جمع شود.',
  },
  {
    title: '۶) امتیازدهی',
    body: 'پاسخ معتبر و یکتا: ۱۰ امتیاز. پاسخ معتبر ولی تکراری با بازیکن دیگر: ۵ امتیاز. پاسخ خالی یا شروع‌نشده با حرف صحیح: صفر امتیاز.',
  },
  {
    title: '۷) دور بعدی',
    body: 'بعد از مشاهده‌ی نتایج، میزبان می‌تواند دور بعدی را شروع کند. بازیکنان همان حالت قبل می‌مانند و نیازی به وصل‌شدن مجدد نیست.',
  },
];

export default function HowToPlayScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.intro}>
          «اسم فامیل» یک بازی کلاسیک گروهی است. در این نسخه، بدون نیاز به اینترنت و فقط با Wi-Fi محلی، می‌توانید با دوستان‌تان بازی کنید.
        </Text>

        {sections.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}

        <View style={[styles.card, styles.tipCard]}>
          <Text style={styles.tipTitle}>💡 نکته</Text>
          <Text style={styles.body}>
            تطبیق پاسخ‌های تکراری بدون حساسیت به فاصله و نیم‌فاصله انجام می‌شود؛ نسخه‌های مختلف عربی/فارسی حروف (مانند «ي» و «ی»، «ك» و «ک»، یا «أ»، «إ» و «ا») یکسان در نظر گرفته می‌شوند.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.lg, gap: Spacing.md },
  intro: {
    fontFamily: Font.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.soft,
    gap: 6,
  },
  tipCard: {
    backgroundColor: '#1a2540',
    borderColor: Colors.accent,
  },
  title: { fontFamily: Font.bold, fontSize: 15, color: Colors.accent, textAlign: 'right' },
  tipTitle: { fontFamily: Font.bold, fontSize: 15, color: Colors.warning, textAlign: 'right' },
  body: {
    fontFamily: Font.regular,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    lineHeight: 24,
  },
});
