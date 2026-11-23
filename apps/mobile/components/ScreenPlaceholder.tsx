import { ScrollView, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle: string;
  sections: string[];
};

export function ScreenPlaceholder({ title, subtitle, sections }: Props) {
  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="p-4 gap-3">
      <Text className="text-2xl font-bold text-text">{title}</Text>
      <Text className="text-sm text-muted">{subtitle}</Text>
      {sections.map((s) => (
        <View key={s} className="rounded-xl bg-card p-4">
          <Text className="text-base font-semibold text-text">{s}</Text>
          <Text className="mt-1 text-xs text-muted">Coming soon</Text>
        </View>
      ))}
    </ScrollView>
  );
}
