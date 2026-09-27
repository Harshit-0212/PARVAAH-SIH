import { getUserProfile } from '../../lib/auth/roleGuards';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect('/login?redirectTo=/dashboard');
  }

  // Server-side redirect based on user role
  switch (profile.role) {
    case 'citizen':
      redirect('/dashboard/citizen');
    case 'officer':
      redirect('/dashboard/officer');
    case 'admin':
      redirect('/dashboard/admin');
    default:
      redirect('/dashboard/citizen');
  }
}
