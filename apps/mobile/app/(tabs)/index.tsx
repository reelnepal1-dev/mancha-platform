import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';

export default function MoviesScreen() {
  return (
    <ScreenPlaceholder
      title="Movies"
      subtitle="Cinemas across Nepal"
      sections={['Now Showing', 'Pre-Booking', 'Upcoming', 'Languages', 'Box Office (NPR)']}
    />
  );
}
