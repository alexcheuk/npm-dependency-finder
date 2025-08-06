import { NextRequest, NextResponse } from 'next/server';
import { findCompatibleVersion, SearchParams } from '@/lib/package-finder';

export async function POST(request: NextRequest) {
  try {
    const body: SearchParams = await request.json();
    
    // Validate required fields
    if (!body.parentPackage || !body.childPackage) {
      return NextResponse.json(
        { error: 'Parent package and child package are required' },
        { status: 400 }
      );
    }

    if (!body.packageRemoved && !body.childMinVersion) {
      return NextResponse.json(
        { error: 'Child minimum version is required when package is not marked as removed' },
        { status: 400 }
      );
    }

    // When packageRemoved is checked, we need either minimum version or just the removal condition
    if (body.packageRemoved && !body.childMinVersion) {
      // This is valid - looking for package removal only
    }

    const result = await findCompatibleVersion(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}