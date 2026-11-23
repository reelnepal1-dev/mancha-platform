import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  body: string;
  containsSpoilers: boolean;
};

/**
 * Brief rule: reviews with contains_spoilers = true MUST stay hidden
 * behind a "Tap to Reveal Spoiler" toggle until the user taps.
 */
export function SpoilerReview({ body, containsSpoilers }: Props) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (revealed) {
    return <Text className="text-sm leading-5 text-text">{body}</Text>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tap to Reveal Spoiler"
      onPress={() => setRevealed(true)}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      {/* Text is never rendered until revealed, so it can't be read or screen-scraped */}
      <View className="gap-1.5 p-3 opacity-40">
        <View className="h-3 w-11/12 rounded bg-muted" />
        <View className="h-3 w-4/5 rounded bg-muted" />
        <View className="h-3 w-2/3 rounded bg-muted" />
      </View>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-text">
          Tap to Reveal Spoiler
        </Text>
      </View>
    </Pressable>
  );
}
