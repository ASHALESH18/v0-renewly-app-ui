'use client'

import type { CSSProperties, SyntheticEvent } from 'react'

export type SubscriptionIconSize = 'sm' | 'md' | 'lg' | number

export interface BrandConfig {
  name: string
  displayName: string
  color: string
  textColor?: string
  logoUrls?: string[]
  logoBackground?: string
}

type BrandEntry = {
  aliases: string[]
  displayName: string
  color: string
  textColor?: string
  simpleIcon?: string
  domain?: string
  domains?: string[]
  logoBackground?: string
}

const simpleIcon = (slug: string) => `https://cdn.simpleicons.org/${slug}`
const clearbit = (domain: string) => `https://logo.clearbit.com/${domain}`

const brandEntries: BrandEntry[] = [
  // Streaming
  { aliases: ['netflix'], displayName: 'Netflix', color: '#E50914', simpleIcon: 'netflix', domain: 'netflix.com' },
  { aliases: ['amazon prime video', 'prime video'], displayName: 'Prime Video', color: '#00A8E1', simpleIcon: 'primevideo', domain: 'primevideo.com' },
  { aliases: ['amazon prime', 'prime'], displayName: 'Amazon Prime', color: '#00A8E1', simpleIcon: 'amazonprime', domain: 'amazon.com' },
  { aliases: ['disney', 'disney+', 'disney plus'], displayName: 'Disney+', color: '#113CCF', simpleIcon: 'disneyplus', domain: 'disneyplus.com' },
  { aliases: ['disney+ hotstar', 'disney hotstar', 'hotstar'], displayName: 'Disney+ Hotstar', color: '#113CCF', simpleIcon: 'disneyplus', domains: ['hotstar.com', 'disneyplus.com'] },
  { aliases: ['hulu'], displayName: 'Hulu', color: '#1CE783', simpleIcon: 'hulu', domain: 'hulu.com' },
  { aliases: ['max', 'hbo max', 'hbo'], displayName: 'Max', color: '#5822B4', simpleIcon: 'max', domains: ['max.com', 'hbomax.com'] },
  { aliases: ['apple tv', 'apple tv+', 'apple tv plus'], displayName: 'Apple TV+', color: '#000000', simpleIcon: 'appletv', domain: 'tv.apple.com' },
  { aliases: ['jiocinema', 'jio cinema'], displayName: 'JioCinema', color: '#D9008D', domain: 'jiocinema.com' },
  { aliases: ['sonyliv', 'sony liv'], displayName: 'SonyLIV', color: '#111111', domain: 'sonyliv.com' },
  { aliases: ['zee5', 'zee 5'], displayName: 'Zee5', color: '#7C3AED', domain: 'zee5.com' },
  { aliases: ['sun nxt', 'sunnxt'], displayName: 'Sun NXT', color: '#FF7A1A', domain: 'sunnxt.com' },
  { aliases: ['aha'], displayName: 'Aha', color: '#FF6B00', domain: 'aha.video' },
  { aliases: ['hoichoi'], displayName: 'Hoichoi', color: '#E73B4B', domain: 'hoichoi.tv' },
  { aliases: ['eros now', 'erosnow'], displayName: 'Eros Now', color: '#E02D2D', domain: 'erosnow.com' },
  { aliases: ['peacock'], displayName: 'Peacock', color: '#111827', simpleIcon: 'peacock', domain: 'peacocktv.com' },
  { aliases: ['paramount+', 'paramount plus'], displayName: 'Paramount+', color: '#0064FF', simpleIcon: 'paramountplus', domain: 'paramountplus.com' },
  { aliases: ['sling tv', 'sling'], displayName: 'Sling TV', color: '#00AEEF', simpleIcon: 'sling', domain: 'sling.com' },
  { aliases: ['fubo', 'fubotv'], displayName: 'Fubo', color: '#FF4C00', domain: 'fubo.tv' },
  { aliases: ['dazn'], displayName: 'DAZN', color: '#000000', simpleIcon: 'dazn', domain: 'dazn.com' },
  { aliases: ['now', 'now tv', 'nowtv'], displayName: 'NOW', color: '#00A4B4', domain: 'nowtv.com' },
  { aliases: ['sky'], displayName: 'Sky', color: '#0072C9', simpleIcon: 'sky', domain: 'sky.com' },
  { aliases: ['canal+', 'canal plus'], displayName: 'Canal+', color: '#000000', simpleIcon: 'canalplus', domain: 'canalplus.com' },

  // Music
  { aliases: ['spotify'], displayName: 'Spotify', color: '#1DB954', simpleIcon: 'spotify', domain: 'spotify.com' },
  { aliases: ['apple music'], displayName: 'Apple Music', color: '#FA233B', simpleIcon: 'applemusic', domain: 'music.apple.com' },
  { aliases: ['youtube premium', 'youtube music', 'youtube music premium', 'youtube'], displayName: 'YouTube Premium', color: '#FF0000', simpleIcon: 'youtube', domain: 'youtube.com' },
  { aliases: ['amazon music'], displayName: 'Amazon Music', color: '#25D1DA', simpleIcon: 'amazonmusic', domain: 'music.amazon.com' },
  { aliases: ['tidal'], displayName: 'Tidal', color: '#000000', simpleIcon: 'tidal', domain: 'tidal.com' },
  { aliases: ['deezer'], displayName: 'Deezer', color: '#A238FF', simpleIcon: 'deezer', domain: 'deezer.com' },
  { aliases: ['pandora'], displayName: 'Pandora', color: '#005483', simpleIcon: 'pandora', domain: 'pandora.com' },
  { aliases: ['gaana'], displayName: 'Gaana', color: '#E72C30', domain: 'gaana.com' },
  { aliases: ['jiosaavn', 'jio saavn'], displayName: 'JioSaavn', color: '#2BC5B4', domain: 'jiosaavn.com' },
  { aliases: ['wynk music', 'wynk'], displayName: 'Wynk Music', color: '#F0232F', domain: 'wynk.in' },
  { aliases: ['audible'], displayName: 'Audible', color: '#F8991C', simpleIcon: 'audible', domain: 'audible.com' },
  { aliases: ['kindle unlimited', 'kindle'], displayName: 'Kindle Unlimited', color: '#FF9900', simpleIcon: 'amazonkindle', domain: 'amazon.com' },

  // AI & tools
  { aliases: ['chatgpt', 'chatgpt plus', 'openai'], displayName: 'ChatGPT', color: '#10A37F', simpleIcon: 'openai', domain: 'openai.com' },
  { aliases: ['claude', 'anthropic'], displayName: 'Claude', color: '#D97757', simpleIcon: 'anthropic', domain: 'anthropic.com' },
  { aliases: ['perplexity'], displayName: 'Perplexity', color: '#1FB8CD', simpleIcon: 'perplexity', domain: 'perplexity.ai' },
  { aliases: ['gemini advanced', 'gemini', 'google gemini'], displayName: 'Gemini', color: '#4285F4', simpleIcon: 'googlegemini', domain: 'gemini.google.com' },
  { aliases: ['microsoft copilot', 'copilot'], displayName: 'Microsoft Copilot', color: '#0078D4', simpleIcon: 'microsoftcopilot', domain: 'microsoft.com' },
  { aliases: ['github copilot'], displayName: 'GitHub Copilot', color: '#181717', simpleIcon: 'githubcopilot', domain: 'github.com' },
  { aliases: ['cursor'], displayName: 'Cursor', color: '#111827', simpleIcon: 'cursor', domain: 'cursor.com' },
  { aliases: ['midjourney'], displayName: 'Midjourney', color: '#000000', simpleIcon: 'midjourney', domain: 'midjourney.com' },
  { aliases: ['runway'], displayName: 'Runway', color: '#111111', domain: 'runwayml.com' },
  { aliases: ['elevenlabs'], displayName: 'ElevenLabs', color: '#111111', simpleIcon: 'elevenlabs', domain: 'elevenlabs.io' },

  // Productivity / SaaS
  { aliases: ['notion'], displayName: 'Notion', color: '#000000', simpleIcon: 'notion', domain: 'notion.so' },
  { aliases: ['microsoft', 'microsoft 365', 'office 365'], displayName: 'Microsoft 365', color: '#0078D4', simpleIcon: 'microsoft', domain: 'microsoft.com' },
  { aliases: ['google workspace'], displayName: 'Google Workspace', color: '#4285F4', simpleIcon: 'google', domain: 'workspace.google.com' },
  { aliases: ['slack'], displayName: 'Slack', color: '#4A154B', simpleIcon: 'slack', domain: 'slack.com' },
  { aliases: ['zoom'], displayName: 'Zoom', color: '#2D8CFF', simpleIcon: 'zoom', domain: 'zoom.us' },
  { aliases: ['trello'], displayName: 'Trello', color: '#0052CC', simpleIcon: 'trello', domain: 'trello.com' },
  { aliases: ['asana'], displayName: 'Asana', color: '#F06A6A', simpleIcon: 'asana', domain: 'asana.com' },
  { aliases: ['clickup'], displayName: 'ClickUp', color: '#7B68EE', simpleIcon: 'clickup', domain: 'clickup.com' },
  { aliases: ['todoist'], displayName: 'Todoist', color: '#E44332', simpleIcon: 'todoist', domain: 'todoist.com' },
  { aliases: ['evernote'], displayName: 'Evernote', color: '#00A82D', simpleIcon: 'evernote', domain: 'evernote.com' },
  { aliases: ['grammarly'], displayName: 'Grammarly', color: '#15C39A', simpleIcon: 'grammarly', domain: 'grammarly.com' },
  { aliases: ['canva', 'canva pro'], displayName: 'Canva', color: '#00C4CC', simpleIcon: 'canva', domain: 'canva.com' },
  { aliases: ['figma'], displayName: 'Figma', color: '#F24E1E', simpleIcon: 'figma', domain: 'figma.com' },
  { aliases: ['adobe', 'adobe creative cloud', 'creative cloud'], displayName: 'Adobe Creative Cloud', color: '#FF0000', simpleIcon: 'adobe', domain: 'adobe.com' },
  { aliases: ['github'], displayName: 'GitHub', color: '#181717', simpleIcon: 'github', domain: 'github.com' },
  { aliases: ['gitlab'], displayName: 'GitLab', color: '#FC6D26', simpleIcon: 'gitlab', domain: 'gitlab.com' },

  // Cloud & storage
  { aliases: ['google one'], displayName: 'Google One', color: '#4285F4', simpleIcon: 'googleone', domain: 'one.google.com' },
  { aliases: ['google drive'], displayName: 'Google Drive', color: '#4285F4', simpleIcon: 'googledrive', domain: 'drive.google.com' },
  { aliases: ['dropbox'], displayName: 'Dropbox', color: '#0061FF', simpleIcon: 'dropbox', domain: 'dropbox.com' },
  { aliases: ['icloud', 'icloud+'], displayName: 'iCloud+', color: '#3693F3', simpleIcon: 'icloud', domain: 'icloud.com' },
  { aliases: ['onedrive', 'one drive'], displayName: 'OneDrive', color: '#0078D4', simpleIcon: 'microsoftonedrive', domain: 'onedrive.live.com' },
  { aliases: ['box'], displayName: 'Box', color: '#0061D5', simpleIcon: 'box', domain: 'box.com' },
  { aliases: ['mega'], displayName: 'MEGA', color: '#D9272E', simpleIcon: 'mega', domain: 'mega.io' },
  { aliases: ['proton drive'], displayName: 'Proton Drive', color: '#6D4AFF', simpleIcon: 'protondrive', domain: 'proton.me' },

  // Gaming
  { aliases: ['playstation', 'playstation plus', 'ps plus', 'ps+'], displayName: 'PlayStation Plus', color: '#003791', simpleIcon: 'playstation', domain: 'playstation.com' },
  { aliases: ['xbox', 'xbox game pass', 'game pass', 'gamepass'], displayName: 'Xbox Game Pass', color: '#107C10', simpleIcon: 'xbox', domain: 'xbox.com' },
  { aliases: ['nintendo', 'nintendo switch online', 'switch online'], displayName: 'Nintendo Switch Online', color: '#E60012', simpleIcon: 'nintendo', domain: 'nintendo.com' },
  { aliases: ['ea play', 'ea'], displayName: 'EA Play', color: '#FF4747', simpleIcon: 'ea', domain: 'ea.com' },
  { aliases: ['ubisoft+', 'ubisoft plus', 'ubisoft'], displayName: 'Ubisoft+', color: '#000000', simpleIcon: 'ubisoft', domain: 'ubisoft.com' },
  { aliases: ['geforce now', 'nvidia geforce now'], displayName: 'GeForce Now', color: '#76B900', simpleIcon: 'nvidia', domain: 'nvidia.com' },
  { aliases: ['discord', 'discord nitro'], displayName: 'Discord Nitro', color: '#5865F2', simpleIcon: 'discord', domain: 'discord.com' },
  { aliases: ['steam'], displayName: 'Steam', color: '#000000', simpleIcon: 'steam', domain: 'steampowered.com' },
  { aliases: ['apple arcade'], displayName: 'Apple Arcade', color: '#000000', simpleIcon: 'applearcade', domain: 'apple.com' },

  // Fitness / wellness
  { aliases: ['cult.fit', 'cult fit', 'cultfit'], displayName: 'Cult.fit', color: '#F97316', domain: 'cult.fit' },
  { aliases: ['strava'], displayName: 'Strava', color: '#FC4C02', simpleIcon: 'strava', domain: 'strava.com' },
  { aliases: ['peloton'], displayName: 'Peloton', color: '#181A1D', simpleIcon: 'peloton', domain: 'onepeloton.com' },
  { aliases: ['healthifyme'], displayName: 'HealthifyMe', color: '#21A67A', domain: 'healthifyme.com' },
  { aliases: ['myfitnesspal'], displayName: 'MyFitnessPal', color: '#0066EE', simpleIcon: 'myfitnesspal', domain: 'myfitnesspal.com' },
  { aliases: ['calm'], displayName: 'Calm', color: '#2844CC', simpleIcon: 'calm', domain: 'calm.com' },
  { aliases: ['headspace'], displayName: 'Headspace', color: '#F47D31', simpleIcon: 'headspace', domain: 'headspace.com' },
  { aliases: ['nike training club'], displayName: 'Nike Training Club', color: '#111111', simpleIcon: 'nike', domain: 'nike.com' },

  // News & media
  { aliases: ['nytimes', 'new york times', 'the new york times'], displayName: 'NYTimes', color: '#000000', simpleIcon: 'nytimes', domain: 'nytimes.com' },
  { aliases: ['washington post', 'the washington post'], displayName: 'Washington Post', color: '#111111', domain: 'washingtonpost.com' },
  { aliases: ['wall street journal', 'wsj'], displayName: 'Wall Street Journal', color: '#0274B6', domain: 'wsj.com' },
  { aliases: ['bloomberg'], displayName: 'Bloomberg', color: '#000000', simpleIcon: 'bloomberg', domain: 'bloomberg.com' },
  { aliases: ['financial times', 'ft'], displayName: 'Financial Times', color: '#FFF1E5', simpleIcon: 'financialtimes', domain: 'ft.com', logoBackground: '#FFF1E5' },
  { aliases: ['the guardian', 'guardian'], displayName: 'The Guardian', color: '#052962', simpleIcon: 'theguardian', domain: 'theguardian.com' },
  { aliases: ['the economist', 'economist'], displayName: 'The Economist', color: '#E3120B', simpleIcon: 'theeconomist', domain: 'economist.com' },
  { aliases: ['medium'], displayName: 'Medium', color: '#000000', simpleIcon: 'medium', domain: 'medium.com' },
  { aliases: ['substack'], displayName: 'Substack', color: '#FF6719', simpleIcon: 'substack', domain: 'substack.com' },
  { aliases: ['the hindu'], displayName: 'The Hindu', color: '#003366', domain: 'thehindu.com' },
  { aliases: ['times of india', 'toi'], displayName: 'Times of India', color: '#ED1C24', domain: 'timesofindia.indiatimes.com' },
  { aliases: ['indian express'], displayName: 'Indian Express', color: '#111111', domain: 'indianexpress.com' },
  { aliases: ['economic times', 'et'], displayName: 'Economic Times', color: '#E91E63', domain: 'economictimes.indiatimes.com' },

  // Education
  { aliases: ['coursera', 'coursera plus'], displayName: 'Coursera', color: '#0056D2', simpleIcon: 'coursera', domain: 'coursera.org' },
  { aliases: ['udemy'], displayName: 'Udemy', color: '#A435F0', simpleIcon: 'udemy', domain: 'udemy.com' },
  { aliases: ['skillshare'], displayName: 'Skillshare', color: '#002333', simpleIcon: 'skillshare', domain: 'skillshare.com' },
  { aliases: ['masterclass', 'master class'], displayName: 'MasterClass', color: '#000000', simpleIcon: 'masterclass', domain: 'masterclass.com' },
  { aliases: ['duolingo', 'duolingo super'], displayName: 'Duolingo', color: '#58CC02', simpleIcon: 'duolingo', domain: 'duolingo.com' },
  { aliases: ['babbel'], displayName: 'Babbel', color: '#FF6A00', simpleIcon: 'babbel', domain: 'babbel.com' },
  { aliases: ['blinkist'], displayName: 'Blinkist', color: '#0FAB59', simpleIcon: 'blinkist', domain: 'blinkist.com' },
  { aliases: ['pluralsight'], displayName: 'Pluralsight', color: '#F15B2A', simpleIcon: 'pluralsight', domain: 'pluralsight.com' },
  { aliases: ['linkedin learning'], displayName: 'LinkedIn Learning', color: '#0A66C2', simpleIcon: 'linkedin', domain: 'linkedin.com' },
  { aliases: ['brilliant'], displayName: 'Brilliant', color: '#111111', simpleIcon: 'brilliant', domain: 'brilliant.org' },

  // Finance
  { aliases: ['zerodha'], displayName: 'Zerodha', color: '#387ED1', domain: 'zerodha.com' },
  { aliases: ['groww'], displayName: 'Groww', color: '#00B386', domain: 'groww.in' },
  { aliases: ['et money', 'etmoney'], displayName: 'ET Money', color: '#1E88E5', domain: 'etmoney.com' },
  { aliases: ['cred'], displayName: 'CRED', color: '#111111', domain: 'cred.club' },
  { aliases: ['phonepe', 'phone pe'], displayName: 'PhonePe', color: '#5F259F', simpleIcon: 'phonepe', domain: 'phonepe.com' },
  { aliases: ['revolut'], displayName: 'Revolut', color: '#0666EB', simpleIcon: 'revolut', domain: 'revolut.com' },
  { aliases: ['n26'], displayName: 'N26', color: '#48C39E', simpleIcon: 'n26', domain: 'n26.com' },
  { aliases: ['monzo'], displayName: 'Monzo', color: '#FF3464', simpleIcon: 'monzo', domain: 'monzo.com' },
  { aliases: ['ynab'], displayName: 'YNAB', color: '#1A6AFF', domain: 'ynab.com' },
  { aliases: ['tradingview'], displayName: 'TradingView', color: '#2962FF', simpleIcon: 'tradingview', domain: 'tradingview.com' },

  // Shopping / delivery
  { aliases: ['costco'], displayName: 'Costco', color: '#E31837', simpleIcon: 'costco', domain: 'costco.com' },
  { aliases: ['sams club', "sam's club"], displayName: "Sam's Club", color: '#0067A0', domain: 'samsclub.com' },
  { aliases: ['walmart+', 'walmart plus'], displayName: 'Walmart+', color: '#0071CE', simpleIcon: 'walmart', domain: 'walmart.com' },
  { aliases: ['flipkart plus', 'flipkart'], displayName: 'Flipkart Plus', color: '#2874F0', simpleIcon: 'flipkart', domain: 'flipkart.com' },
  { aliases: ['swiggy one', 'swiggy'], displayName: 'Swiggy One', color: '#F1511B', simpleIcon: 'swiggy', domain: 'swiggy.com' },
  { aliases: ['zomato gold', 'zomato'], displayName: 'Zomato Gold', color: '#EF4F5F', simpleIcon: 'zomato', domain: 'zomato.com' },
  { aliases: ['instacart'], displayName: 'Instacart', color: '#43B02A', simpleIcon: 'instacart', domain: 'instacart.com' },
  { aliases: ['blinkit'], displayName: 'Blinkit', color: '#F8CB46', domain: 'blinkit.com', logoBackground: '#111111' },
  { aliases: ['times prime'], displayName: 'Times Prime', color: '#D32F2F', domain: 'timesprime.com' },

  // Security
  { aliases: ['nordvpn', 'nord vpn'], displayName: 'NordVPN', color: '#4687FF', simpleIcon: 'nordvpn', domain: 'nordvpn.com' },
  { aliases: ['expressvpn', 'express vpn'], displayName: 'ExpressVPN', color: '#DA3940', simpleIcon: 'expressvpn', domain: 'expressvpn.com' },
  { aliases: ['surfshark', 'surf shark'], displayName: 'Surfshark', color: '#0D9488', simpleIcon: 'surfshark', domain: 'surfshark.com' },
  { aliases: ['1password', '1 password'], displayName: '1Password', color: '#0572EC', simpleIcon: '1password', domain: '1password.com' },
  { aliases: ['bitwarden'], displayName: 'Bitwarden', color: '#175DDC', simpleIcon: 'bitwarden', domain: 'bitwarden.com' },
  { aliases: ['lastpass', 'last pass'], displayName: 'LastPass', color: '#D32D27', simpleIcon: 'lastpass', domain: 'lastpass.com' },
  { aliases: ['norton', 'norton 360'], displayName: 'Norton 360', color: '#FFE01B', simpleIcon: 'norton', domain: 'norton.com', logoBackground: '#111111' },
  { aliases: ['mcafee'], displayName: 'McAfee', color: '#C01818', simpleIcon: 'mcafee', domain: 'mcafee.com' },
  { aliases: ['proton vpn'], displayName: 'Proton VPN', color: '#6D4AFF', simpleIcon: 'protonvpn', domain: 'protonvpn.com' },

  // Utilities / telecom / DTH
  { aliases: ['jiofiber', 'jio fiber', 'jio broadband'], displayName: 'JioFiber', color: '#003DA5', domain: 'jio.com' },
  { aliases: ['airtel xstream', 'airtel xstream fiber', 'airtel fiber', 'airtel broadband'], displayName: 'Airtel Xstream Fiber', color: '#E2231A', domain: 'airtel.in' },
  { aliases: ['act fibernet', 'act broadband', 'act'], displayName: 'ACT Fibernet', color: '#FFCC00', domain: 'actcorp.in', logoBackground: '#111111' },
  { aliases: ['asianet broadband', 'asianet'], displayName: 'Asianet Broadband', color: '#E91E63', domain: 'asianetbroadband.in' },
  { aliases: ['hathway', 'hathway broadband'], displayName: 'Hathway', color: '#ED1C24', domain: 'hathway.com' },
  { aliases: ['excitel'], displayName: 'Excitel', color: '#0093D0', domain: 'excitel.com' },
  { aliases: ['tata play', 'tata sky'], displayName: 'Tata Play', color: '#0066B3', domain: 'tataplay.com' },
  { aliases: ['dish tv', 'dishtv'], displayName: 'Dish TV', color: '#E63946', domain: 'dishtv.in' },
  { aliases: ['d2h', 'videocon d2h'], displayName: 'D2H', color: '#FF6B00', domain: 'd2h.com' },

  // Services / home services
  { aliases: ['rentomojo'], displayName: 'Rentomojo', color: '#FF5F1F', domain: 'rentomojo.com' },
  { aliases: ['furlenco'], displayName: 'Furlenco', color: '#1A1A1A', domain: 'furlenco.com' },
  { aliases: ['urban company', 'urbanclap', 'urban clap'], displayName: 'Urban Company', color: '#7C2AE8', domain: 'urbancompany.com' },
  { aliases: ['nobroker', 'no broker'], displayName: 'NoBroker', color: '#D32F2F', domain: 'nobroker.in' },
  { aliases: ['wakefit'], displayName: 'Wakefit', color: '#FFC107', domain: 'wakefit.co' },

  // Renewly system-managed subscriptions
  { aliases: ['renewly', 'renewly pro', 'renewly family'], displayName: 'Renewly', color: '#C7A36A', textColor: '#1A1A1A' },
]

const makeLogoUrls = (entry: BrandEntry) => {
  const urls: string[] = []
  if (entry.simpleIcon) urls.push(simpleIcon(entry.simpleIcon))
  if (entry.domain) urls.push(clearbit(entry.domain))
  entry.domains?.forEach((domain) => urls.push(clearbit(domain)))
  return Array.from(new Set(urls))
}

const brandMap: Record<string, BrandConfig> = {}

for (const entry of brandEntries) {
  const config: BrandConfig = {
    name: normalizeServiceName(entry.displayName),
    displayName: entry.displayName,
    color: entry.color,
    textColor: entry.textColor,
    logoBackground: entry.logoBackground,
    logoUrls: makeLogoUrls(entry),
  }

  for (const alias of entry.aliases) {
    brandMap[normalizeServiceName(alias)] = config
  }
}

export function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[+/&]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getBrandConfig(serviceName: string): BrandConfig | null {
  const normalized = normalizeServiceName(serviceName)
  return brandMap[normalized] || null
}

export function hasBrandIcon(serviceName: string): boolean {
  return getBrandConfig(serviceName) !== null
}

export function getBrandIcon(serviceName: string) {
  const config = getBrandConfig(serviceName)
  if (!config) return null
  return <BrandLogoImage config={config} size="md" />
}

export function getBrandColor(serviceName: string): string | null {
  const config = getBrandConfig(serviceName)
  return config?.color || null
}

export function getSupportedBrands(): string[] {
  return Array.from(new Set(Object.values(brandMap).map((brand) => brand.displayName))).sort()
}

function getReadableTextColor(backgroundColor?: string) {
  const fallback = '#FFFFFF'
  if (!backgroundColor || !backgroundColor.startsWith('#')) return fallback

  const hex = backgroundColor.replace('#', '')
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex

  if (normalized.length !== 6) return fallback

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255

  return luminance > 0.62 ? '#111827' : '#FFFFFF'
}

function getInitials(name: string) {
  return name
    .split(/[\s/+&-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('') || '?'
}

const shellSizeClasses = {
  sm: 'w-8 h-8 rounded-xl p-1.5',
  md: 'w-10 h-10 rounded-xl p-2',
  lg: 'w-12 h-12 rounded-2xl p-2.5',
}

const fallbackSizeClasses = {
  sm: 'w-8 h-8 text-[10px] rounded-xl',
  md: 'w-10 h-10 text-xs rounded-xl',
  lg: 'w-12 h-12 text-sm rounded-2xl',
}

function getShellClass(size: SubscriptionIconSize) {
  if (typeof size !== 'number') return shellSizeClasses[size]
  return 'rounded-xl p-1.5'
}

function getFallbackClass(size: SubscriptionIconSize) {
  if (typeof size !== 'number') return fallbackSizeClasses[size]
  return 'rounded-xl text-[10px]'
}

function getSizeStyle(size: SubscriptionIconSize): CSSProperties {
  if (typeof size !== 'number') return {}
  return { width: size, height: size }
}

function handleLogoError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  const urls = (image.dataset.logoUrls || '').split('|').filter(Boolean)
  const currentIndex = Number.parseInt(image.dataset.logoIndex || '0', 10)
  const nextIndex = currentIndex + 1

  if (urls[nextIndex]) {
    image.dataset.logoIndex = String(nextIndex)
    image.src = urls[nextIndex]
    return
  }

  image.style.display = 'none'
  const fallback = image.nextElementSibling as HTMLElement | null
  if (fallback) fallback.style.display = 'flex'
}

function BrandLogoImage({
  config,
  size = 'md',
}: {
  config: BrandConfig
  size?: SubscriptionIconSize
}) {
  const logoUrls = config.logoUrls || []
  const fallbackColor = config.color || '#6B7280'
  const fallbackTextColor = getReadableTextColor(fallbackColor)
  const initials = getInitials(config.displayName)

  if (!logoUrls.length) {
    return <FallbackBadge name={config.displayName} color={fallbackColor} size={size} />
  }

  return (
    <div
      className={`${getShellClass(size)} relative flex items-center justify-center shrink-0 overflow-hidden border border-black/5 bg-white shadow-sm ring-1 ring-white/30 dark:border-white/10`}
      style={{ ...getSizeStyle(size), backgroundColor: config.logoBackground || '#FFFFFF' }}
      aria-label={`${config.displayName} logo`}
      title={config.displayName}
    >
      <img
        src={logoUrls[0]}
        alt={`${config.displayName} logo`}
        loading="lazy"
        referrerPolicy="no-referrer"
        data-logo-index="0"
        data-logo-urls={logoUrls.join('|')}
        onError={handleLogoError}
        className="h-full w-full object-contain"
      />
      <span
        className="absolute inset-0 hidden items-center justify-center font-bold"
        style={{ backgroundColor: fallbackColor, color: fallbackTextColor }}
        aria-hidden="true"
      >
        {initials}
      </span>
    </div>
  )
}

export function FallbackBadge({
  name,
  color,
  size = 'md',
}: {
  name: string
  color?: string
  size?: SubscriptionIconSize
}) {
  const backgroundColor = color || '#6B7280'

  return (
    <div
      className={`${getFallbackClass(size)} flex items-center justify-center font-bold shrink-0 shadow-sm ring-1 ring-white/20`}
      style={{
        ...getSizeStyle(size),
        backgroundColor,
        color: getReadableTextColor(backgroundColor),
      }}
      aria-label={`${name} icon`}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}

function RenewlyAssetIcon({ size = 'md' }: { size?: SubscriptionIconSize }) {
  // Use consistent sizes
  let containerSize = 40
  if (size === 'sm') {
    containerSize = 32
  } else if (size === 'md') {
    containerSize = 40
  } else if (size === 'lg') {
    containerSize = 48
  }

  return (
    <div
      className="flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/20 rounded-xl overflow-hidden bg-card"
      style={{
        width: containerSize,
        height: containerSize,
      }}
      aria-label="Renewly"
      title="Renewly"
    >
      <img
        src="/icon.svg"
        alt="Renewly"
        className="h-full w-full object-contain p-1"
        onError={(e) => {
          // Fallback to dark PNG if SVG fails to load
          const img = e.target as HTMLImageElement
          img.src = '/icon-dark-32x32.png'
        }}
      />
    </div>
  )
}

export function SubscriptionIcon({
  name,
  fallbackColor,
  size = 'md',
  className = '',
}: {
  name: string
  fallbackColor?: string
  size?: SubscriptionIconSize
  className?: string
}) {
  const brandConfig = getBrandConfig(name)

  // Special handling for Renewly managed subscriptions - use real app icon
  const nameLower = (name || '').toLowerCase().trim()
  const isRenewly = nameLower === 'renewly' || nameLower === 'renewly pro' || nameLower === 'renewly family'

  if (isRenewly) {
    return (
      <div className={className}>
        <RenewlyAssetIcon size={size} />
      </div>
    )
  }

  if (brandConfig) {
    return (
      <div className={className}>
        <BrandLogoImage config={brandConfig} size={size} />
      </div>
    )
  }

  return (
    <div className={className}>
      <FallbackBadge name={name} color={fallbackColor} size={size} />
    </div>
  )
}
