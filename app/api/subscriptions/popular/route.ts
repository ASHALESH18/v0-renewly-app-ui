import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Popular services data is static and public
    // Colors are fallbacks - SubscriptionIcon will use brand colors when available
    const popularServices = [
      { id: 'netflix', name: 'Netflix', category: 'streaming', color: '#E50914' },
      { id: 'spotify', name: 'Spotify', category: 'music', color: '#1DB954' },
      { id: 'github-pro', name: 'GitHub Pro', category: 'productivity', color: '#181717' },
      { id: 'dropbox', name: 'Dropbox', category: 'cloud', color: '#0061FF' },
      { id: 'figma', name: 'Figma', category: 'productivity', color: '#F24E1E' },
      { id: 'adobe-cc', name: 'Adobe Creative Cloud', category: 'productivity', color: '#FF0000' },
      { id: 'canva', name: 'Canva Pro', category: 'productivity', color: '#00C4CC' },
      { id: 'notion', name: 'Notion Plus', category: 'productivity', color: '#000000' },
      { id: 'discord-nitro', name: 'Discord Nitro', category: 'entertainment', color: '#5865F2' },
      { id: 'playstation-plus', name: 'PlayStation Plus', category: 'gaming', color: '#003791' },
      { id: 'amazon-prime', name: 'Amazon Prime', category: 'streaming', color: '#00A8E1' },
      { id: 'hbo-max', name: 'HBO Max', category: 'streaming', color: '#5822B4' },
    ]

    return NextResponse.json({ popularServices })
  } catch (error) {
    console.error('[v0] Popular services API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
