import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  try {
    const { data: sports, error } = await supabase
      .from('sports')
      .select('id, name, description, sport_category, common_positions')
      .order('name');

    if (error) {
      console.error('Error fetching sports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sports: sports || [] });
  } catch (error) {
    console.error('Error in sports API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
