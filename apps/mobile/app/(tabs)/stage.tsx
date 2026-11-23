import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';

export default function StageScreen() {
  return (
    <ScreenPlaceholder
      title="Stage"
      subtitle="Theatre plays, venues, and cast"
      sections={['Running Now', 'Opening Soon', 'Venues', 'Ticket Tiers (NPR)']}
    />
  );
}
