import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';

export default function EventsScreen() {
  return (
    <ScreenPlaceholder
      title="Events"
      subtitle="Concerts, festivals, and performers"
      sections={['This Week', 'Concerts', 'Festivals', 'Free Events']}
    />
  );
}
