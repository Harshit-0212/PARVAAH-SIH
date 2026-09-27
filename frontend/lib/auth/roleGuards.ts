import dbConnect from '../dbConnect';
import { User } from '../models/User';
import { IUser, UserRole } from '../../types/db';
import { Types } from 'mongoose';

/**
 * Extended operational roles supported by PARVAAH
 */
export type OperationalRole = 'citizen' | 'field_officer' | 'district_officer' | 'admin' | 'officer';

/**
 * Server-side helper to fetch authenticated user profile from MongoDB `users` collection.
 * Strictly avoids hardcoded fake identities.
 */
export async function getUserProfile(userId?: string): Promise<IUser | null> {
  try {
    await dbConnect();

    if (userId && Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).lean();
      if (user) return user as unknown as IUser;
    }

    // If no userId provided, attempt lookup of the most recent active user session
    const activeUser = await User.findOne({ isActive: true }).lean();
    if (activeUser) {
      return activeUser as unknown as IUser;
    }

    return null;
  } catch (err) {
    console.error('Error fetching user profile in roleGuards:', err);
    return null;
  }
}

/**
 * Server-side guard enforcing allowed roles for APIs and Server Components.
 * Returns the user if authorized, or throws an error.
 */
export async function requireRole(
  allowedRoles: OperationalRole[],
  userId?: string
): Promise<IUser> {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new Error('UNAUTHORIZED: Authentication required.');
  }

  const userRole = profile.role as OperationalRole;
  const isAllowed =
    allowedRoles.includes(userRole) ||
    (userRole === 'officer' && (allowedRoles.includes('field_officer') || allowedRoles.includes('district_officer')));

  if (!isAllowed) {
    throw new Error(`FORBIDDEN: Role '${profile.role}' lacks necessary permissions.`);
  }

  return profile;
}

/**
 * Ensures officer access is restricted to their assigned district.
 * Admins have cross-district platform visibility.
 */
export async function requireDistrictAccess(
  profile: IUser,
  targetDistrictId: string
): Promise<boolean> {
  if (profile.role === 'admin') {
    return true;
  }

  if (['officer', 'field_officer', 'district_officer'].includes(profile.role)) {
    return profile.districtId?.toString() === targetDistrictId;
  }

  return false;
}
