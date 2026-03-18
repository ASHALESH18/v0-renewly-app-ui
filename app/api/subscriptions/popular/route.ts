import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Popular services data is static and public
    const popularServices = [
      { id: 'netflix', name: 'Netflix', category: 'streaming', logo: '🎬' },
      { id: 'spotify', name: 'Spotify', category: 'music', logo: '🎵' },
      { id: 'github-pro', name: 'GitHub Pro', category: 'productivity', logo: '💻' },
      { id: 'dropbox', name: 'Dropbox', category: 'cloud', logo: '☁️' },
      { id: 'figma', name: 'Figma', category: 'productivity', logo: '🎨' },
      { id: 'adobe-cc', name: 'Adobe Creative Cloud', category: 'productivity', logo: '🎬' },
      { id: 'canva', name: 'Canva Pro', category: 'productivity', logo: '✨' },
      { id: 'notion', name: 'Notion Plus', category: 'productivity', logo: '📝' },
      { id: 'discord-nitro', name: 'Discord Nitro', category: 'entertainment', logo: '🎮' },
      { id: 'playstation-plus', name: 'PlayStation Plus', category: 'gaming', logo: '🎮' },
      { id: 'amazon-prime', name: 'Amazon Prime', category: 'streaming', logo: '🎁' },
      { id: 'hbo-max', name: 'HBO Max', category: 'streaming', logo: '🎬' },
    ]

    return NextResponse.json({ popularServices })
  } catch (error) {
    console.error('[v0] Popular services API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
