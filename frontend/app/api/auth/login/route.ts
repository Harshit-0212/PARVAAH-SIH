import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import { User } from '../../../../lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { phone, password, role, fullName } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: Phone number is required.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const targetRole = role === 'field_officer' ? 'officer' : role || 'citizen';

    // Find existing user by phone or create user record in MongoDB users collection
    let user = await User.findOne({ phone }).lean();

    if (!user) {
      const newUser = new User({
        fullName: fullName || (targetRole === 'officer' ? 'Anurag Kalita (Officer)' : targetRole === 'admin' ? 'State Admin Director' : 'Bhaben Gogoi'),
        phone,
        role: targetRole,
        languagePreference: 'en',
        isActive: true,
      });
      const saved = await newUser.save();
      user = saved.toObject();
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully authenticated with MongoDB.',
        user,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('API Error [POST /api/auth/login]:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
