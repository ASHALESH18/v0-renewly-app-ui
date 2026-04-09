import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Popular services data is static and public
    // Colors are fallbacks - SubscriptionIcon will use brand colors when available
    const popularServices = [
      // Global Streaming
      { id: 'netflix', name: 'Netflix', category: 'streaming', color: '#E50914' },
      { id: 'amazon-prime', name: 'Amazon Prime', category: 'streaming', color: '#00A8E1' },
      { id: 'disney+', name: 'Disney+', category: 'streaming', color: '#113CCF' },
      { id: 'hbo-max', name: 'HBO Max', category: 'streaming', color: '#5822B4' },
      { id: 'hulu', name: 'Hulu', category: 'streaming', color: '#1CE783' },
      
      // India Streaming
      { id: 'hotstar', name: 'Disney+ Hotstar', category: 'streaming', color: '#1F51BA' },
      
      // Music
      { id: 'spotify', name: 'Spotify', category: 'music', color: '#1DB954' },
      { id: 'apple-music', name: 'Apple Music', category: 'music', color: '#FA233B' },
      { id: 'youtube-music', name: 'YouTube Music Premium', category: 'music', color: '#FF0000' },
      
      // Productivity & Cloud
      { id: 'github-pro', name: 'GitHub Pro', category: 'productivity', color: '#181717' },
      { id: 'dropbox', name: 'Dropbox', category: 'cloud', color: '#0061FF' },
      { id: 'figma', name: 'Figma', category: 'productivity', color: '#F24E1E' },
      { id: 'adobe-cc', name: 'Adobe Creative Cloud', category: 'productivity', color: '#FF0000' },
      { id: 'canva', name: 'Canva Pro', category: 'productivity', color: '#00C4CC' },
      { id: 'notion', name: 'Notion Plus', category: 'productivity', color: '#000000' },
      { id: 'chatgpt', name: 'ChatGPT Plus', category: 'ai', color: '#10A37F' },
      { id: 'microsoft-365', name: 'Microsoft 365', category: 'productivity', color: '#0078D4' },
      { id: 'google-one', name: 'Google One', category: 'cloud', color: '#4285F4' },
      { id: 'icloud+', name: 'iCloud+', category: 'cloud', color: '#3693F3' },
      
      // Gaming & Entertainment
      { id: 'discord-nitro', name: 'Discord Nitro', category: 'entertainment', color: '#5865F2' },
      { id: 'playstation-plus', name: 'PlayStation Plus', category: 'gaming', color: '#003791' },
      { id: 'xbox-gamepass', name: 'Xbox Game Pass', category: 'gaming', color: '#107C10' },
      { id: 'nintendo-online', name: 'Nintendo Switch Online', category: 'gaming', color: '#E60012' },
      
      // Wellness & Learning
      { id: 'duolingo', name: 'Duolingo Super', category: 'learning', color: '#58CC02' },
      { id: 'headspace', name: 'Headspace', category: 'fitness', color: '#0ACE6B' },
      { id: 'calm', name: 'Calm', category: 'fitness', color: '#FDD835' },
      
      // Food Delivery & Shopping
      { id: 'swiggy-one', name: 'Swiggy One', category: 'food', color: '#F1511B' },
      { id: 'zomato-gold', name: 'Zomato Gold', category: 'food', color: '#EF4F5F' },
    ]

    return NextResponse.json({ popularServices })
  } catch (error) {
    console.error('[v0] Popular services API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
