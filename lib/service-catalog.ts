/**
 * Centralized Service Catalog
 *
 * Single source of truth for popular subscription/service data used in:
 * - Add Subscription flow (search, grid, filtering)
 * - /api/subscriptions/popular route
 *
 * Lowercase `category` values map to canonical SubscriptionCategory via categoryMap
 * in the Add/Edit Subscription components.
 *
 * `aliases` are used for search (common names, abbreviations, related keywords).
 * `region` is informational and does NOT affect filtering.
 */

export type ServiceRegion = 'GLOBAL' | 'IN' | 'US' | 'UK' | 'EU'

export interface CatalogService {
  id: string
  name: string
  category: string // lowercase id, maps to canonical category
  color: string
  aliases?: string[]
  region?: ServiceRegion
}

export const SERVICE_CATALOG: CatalogService[] = [
  // ────────────────── Streaming ──────────────────
  { id: 'netflix', name: 'Netflix', category: 'streaming', color: '#E50914', region: 'GLOBAL' },
  { id: 'amazon-prime-video', name: 'Amazon Prime Video', category: 'streaming', color: '#00A8E1', aliases: ['prime', 'prime video', 'amazon prime'], region: 'GLOBAL' },
  { id: 'disney-plus', name: 'Disney+', category: 'streaming', color: '#113CCF', aliases: ['disney plus'], region: 'GLOBAL' },
  { id: 'hotstar', name: 'Disney+ Hotstar', category: 'streaming', color: '#1F51BA', aliases: ['hotstar', 'jiohotstar', 'disney hotstar'], region: 'IN' },
  { id: 'jiocinema', name: 'JioCinema', category: 'streaming', color: '#E91E63', aliases: ['jio cinema'], region: 'IN' },
  { id: 'sonyliv', name: 'SonyLIV', category: 'streaming', color: '#000000', aliases: ['sony liv', 'sony tv'], region: 'IN' },
  { id: 'zee5', name: 'Zee5', category: 'streaming', color: '#7B2BFF', aliases: ['zee', 'zee tv'], region: 'IN' },
  { id: 'sunnxt', name: 'Sun NXT', category: 'streaming', color: '#F47C20', aliases: ['sun next'], region: 'IN' },
  { id: 'aha', name: 'Aha', category: 'streaming', color: '#FF6F00', aliases: ['aha video'], region: 'IN' },
  { id: 'hoichoi', name: 'Hoichoi', category: 'streaming', color: '#E63946', region: 'IN' },
  { id: 'erosnow', name: 'Eros Now', category: 'streaming', color: '#D62828', aliases: ['eros'], region: 'IN' },
  { id: 'hulu', name: 'Hulu', category: 'streaming', color: '#1CE783', region: 'US' },
  { id: 'hbo-max', name: 'Max', category: 'streaming', color: '#0046FE', aliases: ['hbo', 'hbo max'], region: 'US' },
  { id: 'peacock', name: 'Peacock', category: 'streaming', color: '#000000', aliases: ['peacock tv'], region: 'US' },
  { id: 'paramount-plus', name: 'Paramount+', category: 'streaming', color: '#0064FF', aliases: ['paramount plus', 'paramount'], region: 'US' },
  { id: 'apple-tv-plus', name: 'Apple TV+', category: 'streaming', color: '#000000', aliases: ['apple tv', 'apple tv plus'], region: 'GLOBAL' },
  { id: 'youtube-premium', name: 'YouTube Premium', category: 'streaming', color: '#FF0000', aliases: ['youtube'], region: 'GLOBAL' },
  { id: 'sling-tv', name: 'Sling TV', category: 'streaming', color: '#00ADEF', aliases: ['sling'], region: 'US' },
  { id: 'fubo', name: 'Fubo', category: 'streaming', color: '#FA4616', aliases: ['fubotv', 'fubo tv'], region: 'US' },
  { id: 'espn-plus', name: 'ESPN+', category: 'streaming', color: '#FF0000', aliases: ['espn plus', 'espn'], region: 'US' },
  { id: 'starz', name: 'Starz', category: 'streaming', color: '#000000', region: 'US' },
  { id: 'showtime', name: 'Showtime', category: 'streaming', color: '#E40000', region: 'US' },
  { id: 'now-tv', name: 'NOW', category: 'streaming', color: '#00B5B0', aliases: ['now tv'], region: 'UK' },
  { id: 'sky', name: 'Sky', category: 'streaming', color: '#003DA5', aliases: ['sky tv', 'sky uk'], region: 'UK' },
  { id: 'itvx', name: 'ITVX', category: 'streaming', color: '#1B0034', aliases: ['itv', 'itv x'], region: 'UK' },
  { id: 'channel-4', name: 'Channel 4+', category: 'streaming', color: '#1FE3AC', aliases: ['channel 4', 'all 4'], region: 'UK' },
  { id: 'britbox', name: 'BritBox', category: 'streaming', color: '#1A4480', aliases: ['brit box'], region: 'UK' },
  { id: 'dazn', name: 'DAZN', category: 'streaming', color: '#F8FF13', aliases: ['dazn sports'], region: 'EU' },
  { id: 'canal-plus', name: 'Canal+', category: 'streaming', color: '#000000', aliases: ['canal plus', 'canal'], region: 'EU' },
  { id: 'crunchyroll', name: 'Crunchyroll', category: 'streaming', color: '#F47521', aliases: ['anime'], region: 'GLOBAL' },

  // ────────────────── Music ──────────────────
  { id: 'spotify', name: 'Spotify', category: 'music', color: '#1DB954', region: 'GLOBAL' },
  { id: 'apple-music', name: 'Apple Music', category: 'music', color: '#FA233B', region: 'GLOBAL' },
  { id: 'amazon-music', name: 'Amazon Music', category: 'music', color: '#00A8E1', aliases: ['amazon music unlimited'], region: 'GLOBAL' },
  { id: 'youtube-music', name: 'YouTube Music', category: 'music', color: '#FF0000', aliases: ['youtube music premium', 'yt music'], region: 'GLOBAL' },
  { id: 'tidal', name: 'Tidal', category: 'music', color: '#000000', region: 'GLOBAL' },
  { id: 'pandora', name: 'Pandora', category: 'music', color: '#005483', region: 'US' },
  { id: 'audible', name: 'Audible', category: 'music', color: '#F8991C', aliases: ['audiobooks'], region: 'GLOBAL' },
  { id: 'kindle-unlimited', name: 'Kindle Unlimited', category: 'music', color: '#232F3E', aliases: ['kindle', 'ebooks'], region: 'GLOBAL' },
  { id: 'gaana', name: 'Gaana', category: 'music', color: '#E72C30', region: 'IN' },
  { id: 'jiosaavn', name: 'JioSaavn', category: 'music', color: '#1ED760', aliases: ['saavn', 'jio saavn'], region: 'IN' },
  { id: 'wynk-music', name: 'Wynk Music', category: 'music', color: '#FF0000', aliases: ['wynk'], region: 'IN' },
  { id: 'deezer', name: 'Deezer', category: 'music', color: '#A238FF', region: 'EU' },
  { id: 'soundcloud', name: 'SoundCloud', category: 'music', color: '#FF5500', aliases: ['sound cloud'], region: 'GLOBAL' },

  // ────────────────── AI & Tools ──────────────────
  { id: 'chatgpt-plus', name: 'ChatGPT Plus', category: 'ai', color: '#10A37F', aliases: ['chatgpt', 'openai', 'gpt', 'ai'], region: 'GLOBAL' },
  { id: 'claude-pro', name: 'Claude Pro', category: 'ai', color: '#D97757', aliases: ['claude', 'anthropic', 'ai'], region: 'GLOBAL' },
  { id: 'perplexity-pro', name: 'Perplexity Pro', category: 'ai', color: '#20808D', aliases: ['perplexity', 'ai search', 'ai'], region: 'GLOBAL' },
  { id: 'gemini-advanced', name: 'Gemini Advanced', category: 'ai', color: '#4285F4', aliases: ['gemini', 'bard', 'google ai', 'ai'], region: 'GLOBAL' },
  { id: 'microsoft-copilot', name: 'Microsoft Copilot', category: 'ai', color: '#0078D4', aliases: ['copilot', 'ai'], region: 'GLOBAL' },
  { id: 'github-copilot', name: 'GitHub Copilot', category: 'ai', color: '#181717', aliases: ['copilot', 'ai coding'], region: 'GLOBAL' },
  { id: 'midjourney', name: 'Midjourney', category: 'ai', color: '#000000', aliases: ['mid journey', 'ai image'], region: 'GLOBAL' },
  { id: 'notion-ai', name: 'Notion AI', category: 'ai', color: '#000000', aliases: ['ai writing'], region: 'GLOBAL' },

  // ────────────────── Productivity / SaaS ──────────────────
  { id: 'microsoft-365', name: 'Microsoft 365', category: 'productivity', color: '#0078D4', aliases: ['office 365', 'office', 'microsoft office'], region: 'GLOBAL' },
  { id: 'google-workspace', name: 'Google Workspace', category: 'productivity', color: '#4285F4', aliases: ['gsuite', 'g suite', 'google apps'], region: 'GLOBAL' },
  { id: 'notion', name: 'Notion', category: 'productivity', color: '#000000', aliases: ['notion plus'], region: 'GLOBAL' },
  { id: 'evernote', name: 'Evernote', category: 'productivity', color: '#00A82D', aliases: ['notes'], region: 'GLOBAL' },
  { id: 'todoist', name: 'Todoist', category: 'productivity', color: '#E44332', aliases: ['todo', 'tasks'], region: 'GLOBAL' },
  { id: 'trello', name: 'Trello', category: 'productivity', color: '#0079BF', region: 'GLOBAL' },
  { id: 'asana', name: 'Asana', category: 'productivity', color: '#F06A6A', region: 'GLOBAL' },
  { id: 'clickup', name: 'ClickUp', category: 'productivity', color: '#7B68EE', aliases: ['click up'], region: 'GLOBAL' },
  { id: 'slack', name: 'Slack', category: 'productivity', color: '#4A154B', region: 'GLOBAL' },
  { id: 'zoom', name: 'Zoom', category: 'productivity', color: '#2D8CFF', aliases: ['video calls'], region: 'GLOBAL' },
  { id: 'adobe-cc', name: 'Adobe Creative Cloud', category: 'productivity', color: '#FF0000', aliases: ['adobe cc', 'creative cloud', 'adobe'], region: 'GLOBAL' },
  { id: 'figma', name: 'Figma', category: 'productivity', color: '#F24E1E', aliases: ['design'], region: 'GLOBAL' },
  { id: 'canva-pro', name: 'Canva Pro', category: 'productivity', color: '#00C4CC', aliases: ['canva'], region: 'GLOBAL' },
  { id: 'github-pro', name: 'GitHub Pro', category: 'productivity', color: '#181717', aliases: ['github'], region: 'GLOBAL' },
  { id: 'gitlab', name: 'GitLab', category: 'productivity', color: '#FC6D26', aliases: ['git lab'], region: 'GLOBAL' },
  { id: 'grammarly', name: 'Grammarly', category: 'productivity', color: '#15C39A', aliases: ['writing'], region: 'GLOBAL' },
  { id: 'linear', name: 'Linear', category: 'productivity', color: '#5E6AD2', aliases: ['issue tracker'], region: 'GLOBAL' },

  // ────────────────── Cloud & Storage ──────────────────
  { id: 'dropbox', name: 'Dropbox', category: 'cloud', color: '#0061FF', aliases: ['storage', 'cloud storage'], region: 'GLOBAL' },
  { id: 'google-one', name: 'Google One', category: 'cloud', color: '#4285F4', aliases: ['google storage', 'storage', 'cloud storage'], region: 'GLOBAL' },
  { id: 'icloud-plus', name: 'iCloud+', category: 'cloud', color: '#3693F3', aliases: ['icloud', 'icloud plus', 'storage', 'cloud storage'], region: 'GLOBAL' },
  { id: 'onedrive', name: 'OneDrive', category: 'cloud', color: '#0078D4', aliases: ['microsoft onedrive', 'storage', 'cloud storage'], region: 'GLOBAL' },
  { id: 'box', name: 'Box', category: 'cloud', color: '#0061D5', aliases: ['storage', 'cloud storage'], region: 'GLOBAL' },
  { id: 'pcloud', name: 'pCloud', category: 'cloud', color: '#23A2DA', aliases: ['p cloud', 'storage'], region: 'GLOBAL' },

  // ────────────────── Fitness ──────────────────
  { id: 'peloton', name: 'Peloton', category: 'fitness', color: '#000000', aliases: ['workout', 'fitness app'], region: 'US' },
  { id: 'strava', name: 'Strava', category: 'fitness', color: '#FC4C02', aliases: ['running', 'cycling'], region: 'GLOBAL' },
  { id: 'calm', name: 'Calm', category: 'fitness', color: '#1E5BC6', aliases: ['meditation', 'sleep'], region: 'GLOBAL' },
  { id: 'headspace', name: 'Headspace', category: 'fitness', color: '#F47D31', aliases: ['meditation'], region: 'GLOBAL' },
  { id: 'cult-fit', name: 'Cult.fit', category: 'fitness', color: '#1A2238', aliases: ['cult', 'cure fit', 'curefit'], region: 'IN' },
  { id: 'healthify-me', name: 'HealthifyMe', category: 'fitness', color: '#00BB7E', aliases: ['healthify'], region: 'IN' },
  { id: 'whoop', name: 'Whoop', category: 'fitness', color: '#000000', aliases: ['fitness tracker'], region: 'GLOBAL' },
  { id: 'myfitnesspal', name: 'MyFitnessPal', category: 'fitness', color: '#0072CE', aliases: ['my fitness pal', 'calorie tracker'], region: 'GLOBAL' },

  // ────────────────── News & Media ──────────────────
  { id: 'nytimes', name: 'The New York Times', category: 'news', color: '#000000', aliases: ['nyt', 'nytimes', 'ny times', 'new york times'], region: 'GLOBAL' },
  { id: 'washington-post', name: 'The Washington Post', category: 'news', color: '#000000', aliases: ['wapo', 'wpost'], region: 'US' },
  { id: 'wsj', name: 'Wall Street Journal', category: 'news', color: '#000000', aliases: ['wsj'], region: 'US' },
  { id: 'bloomberg', name: 'Bloomberg', category: 'news', color: '#000000', aliases: ['bloomberg news'], region: 'GLOBAL' },
  { id: 'medium', name: 'Medium', category: 'news', color: '#000000', aliases: ['medium membership'], region: 'GLOBAL' },
  { id: 'substack', name: 'Substack', category: 'news', color: '#FF6719', aliases: ['newsletters'], region: 'GLOBAL' },
  { id: 'ft', name: 'Financial Times', category: 'news', color: '#FFF1E5', aliases: ['ft'], region: 'GLOBAL' },
  { id: 'guardian', name: 'The Guardian', category: 'news', color: '#052962', aliases: ['guardian'], region: 'UK' },
  { id: 'economist', name: 'The Economist', category: 'news', color: '#E3120B', aliases: ['economist'], region: 'GLOBAL' },
  { id: 'the-hindu', name: 'The Hindu', category: 'news', color: '#003366', aliases: ['hindu'], region: 'IN' },
  { id: 'toi', name: 'Times of India', category: 'news', color: '#ED1C24', aliases: ['toi', 'times'], region: 'IN' },
  { id: 'indian-express', name: 'Indian Express', category: 'news', color: '#000000', aliases: ['express'], region: 'IN' },
  { id: 'economic-times', name: 'Economic Times', category: 'news', color: '#E91E63', aliases: ['et', 'economic times'], region: 'IN' },

  // ────────────────── Gaming ──────────────────
  { id: 'playstation-plus', name: 'PlayStation Plus', category: 'gaming', color: '#003791', aliases: ['ps plus', 'ps+', 'psn'], region: 'GLOBAL' },
  { id: 'xbox-game-pass', name: 'Xbox Game Pass', category: 'gaming', color: '#107C10', aliases: ['gamepass', 'game pass', 'xbox'], region: 'GLOBAL' },
  { id: 'nintendo-online', name: 'Nintendo Switch Online', category: 'gaming', color: '#E60012', aliases: ['nintendo online', 'nso', 'switch online'], region: 'GLOBAL' },
  { id: 'ea-play', name: 'EA Play', category: 'gaming', color: '#FF4747', aliases: ['ea', 'electronic arts'], region: 'GLOBAL' },
  { id: 'ubisoft-plus', name: 'Ubisoft+', category: 'gaming', color: '#000000', aliases: ['ubisoft plus', 'ubisoft'], region: 'GLOBAL' },
  { id: 'geforce-now', name: 'GeForce Now', category: 'gaming', color: '#76B900', aliases: ['nvidia gaming', 'cloud gaming'], region: 'GLOBAL' },
  { id: 'discord-nitro', name: 'Discord Nitro', category: 'gaming', color: '#5865F2', aliases: ['discord'], region: 'GLOBAL' },

  // ────────────────── Education ──────────────────
  { id: 'coursera-plus', name: 'Coursera Plus', category: 'education', color: '#0056D2', aliases: ['coursera'], region: 'GLOBAL' },
  { id: 'masterclass', name: 'MasterClass', category: 'education', color: '#000000', aliases: ['master class'], region: 'GLOBAL' },
  { id: 'duolingo-super', name: 'Duolingo Super', category: 'education', color: '#58CC02', aliases: ['duolingo', 'language'], region: 'GLOBAL' },
  { id: 'babbel', name: 'Babbel', category: 'education', color: '#FF6A00', aliases: ['language learning'], region: 'EU' },
  { id: 'blinkist', name: 'Blinkist', category: 'education', color: '#0FAB59', aliases: ['book summaries'], region: 'GLOBAL' },
  { id: 'skillshare', name: 'Skillshare', category: 'education', color: '#002333', aliases: ['skill share', 'creative classes'], region: 'GLOBAL' },
  { id: 'udemy', name: 'Udemy', category: 'education', color: '#A435F0', aliases: ['online courses'], region: 'GLOBAL' },
  { id: 'pluralsight', name: 'Pluralsight', category: 'education', color: '#F15B2A', aliases: ['plural sight', 'tech learning'], region: 'GLOBAL' },

  // ────────────────── Finance ──────────────────
  { id: 'revolut', name: 'Revolut', category: 'finance', color: '#0666EB', aliases: ['neobank'], region: 'EU' },
  { id: 'n26', name: 'N26', category: 'finance', color: '#48C39E', aliases: ['n 26', 'neobank'], region: 'EU' },
  { id: 'monzo', name: 'Monzo', category: 'finance', color: '#FF3464', aliases: ['neobank'], region: 'UK' },
  { id: 'cred', name: 'CRED', category: 'finance', color: '#000000', aliases: ['credit cards'], region: 'IN' },
  { id: 'zerodha', name: 'Zerodha', category: 'finance', color: '#387ED1', aliases: ['kite', 'stocks', 'investing'], region: 'IN' },
  { id: 'groww', name: 'Groww', category: 'finance', color: '#00B386', aliases: ['investing', 'mutual funds'], region: 'IN' },
  { id: 'et-money', name: 'ET Money', category: 'finance', color: '#1E88E5', aliases: ['etmoney', 'investing'], region: 'IN' },
  { id: 'phonepe', name: 'PhonePe', category: 'finance', color: '#5F259F', aliases: ['phone pe', 'upi'], region: 'IN' },

  // ────────────────── Security ──────────────────
  { id: 'nordvpn', name: 'NordVPN', category: 'security', color: '#4687FF', aliases: ['nord', 'vpn'], region: 'GLOBAL' },
  { id: 'expressvpn', name: 'ExpressVPN', category: 'security', color: '#DA3940', aliases: ['express vpn', 'vpn'], region: 'GLOBAL' },
  { id: 'surfshark', name: 'Surfshark', category: 'security', color: '#0D9488', aliases: ['surf shark', 'vpn'], region: 'GLOBAL' },
  { id: '1password', name: '1Password', category: 'security', color: '#0572EC', aliases: ['1pass', 'password manager'], region: 'GLOBAL' },
  { id: 'bitwarden', name: 'Bitwarden', category: 'security', color: '#175DDC', aliases: ['password manager'], region: 'GLOBAL' },
  { id: 'lastpass', name: 'LastPass', category: 'security', color: '#D32D27', aliases: ['last pass', 'password manager'], region: 'GLOBAL' },
  { id: 'norton', name: 'Norton 360', category: 'security', color: '#FFE01B', aliases: ['norton', 'antivirus'], region: 'GLOBAL' },
  { id: 'mcafee', name: 'McAfee', category: 'security', color: '#C01818', aliases: ['mc afee', 'antivirus'], region: 'GLOBAL' },

  // ────────────────── Utilities (Telecom / ISP / DTH) ──────────────────
  { id: 'jiofiber', name: 'JioFiber', category: 'utilities', color: '#003DA5', aliases: ['jio fiber', 'jio broadband', 'broadband'], region: 'IN' },
  { id: 'airtel-xstream-fiber', name: 'Airtel Xstream Fiber', category: 'utilities', color: '#E2231A', aliases: ['airtel fiber', 'xstream', 'airtel broadband', 'broadband'], region: 'IN' },
  { id: 'act-fibernet', name: 'ACT Fibernet', category: 'utilities', color: '#FFCC00', aliases: ['act', 'act broadband', 'broadband'], region: 'IN' },
  { id: 'asianet-broadband', name: 'Asianet Broadband', category: 'utilities', color: '#E91E63', aliases: ['asianet', 'broadband'], region: 'IN' },
  { id: 'hathway', name: 'Hathway', category: 'utilities', color: '#ED1C24', aliases: ['hathway broadband', 'broadband'], region: 'IN' },
  { id: 'excitel', name: 'Excitel', category: 'utilities', color: '#0093D0', aliases: ['broadband'], region: 'IN' },
  { id: 'tata-play', name: 'Tata Play', category: 'utilities', color: '#0066B3', aliases: ['tata sky', 'dth'], region: 'IN' },
  { id: 'dish-tv', name: 'Dish TV', category: 'utilities', color: '#E63946', aliases: ['dishtv', 'dth'], region: 'IN' },
  { id: 'd2h', name: 'D2H', category: 'utilities', color: '#FF6B00', aliases: ['videocon d2h', 'dth'], region: 'IN' },
  { id: 'electricity-addon', name: 'Electricity Add-on', category: 'utilities', color: '#FBBF24', aliases: ['power', 'electric bill'], region: 'GLOBAL' },
  { id: 'lpg-service', name: 'LPG Service', category: 'utilities', color: '#0EA5E9', aliases: ['cooking gas', 'gas cylinder'], region: 'IN' },

  // ────────────────── Home Services ──────────────────
  { id: 'rentomojo', name: 'Rentomojo', category: 'homeservices', color: '#FF5F1F', aliases: ['rent', 'furniture rental'], region: 'IN' },
  { id: 'furlenco', name: 'Furlenco', category: 'homeservices', color: '#1A1A1A', aliases: ['furniture rental', 'rent'], region: 'IN' },
  { id: 'urban-company', name: 'Urban Company', category: 'homeservices', color: '#7C2AE8', aliases: ['urbanclap', 'urban clap', 'home services'], region: 'IN' },
  { id: 'nobroker', name: 'NoBroker', category: 'homeservices', color: '#D32F2F', aliases: ['no broker', 'rent'], region: 'IN' },
  { id: 'wakefit', name: 'Wakefit', category: 'homeservices', color: '#FFC107', aliases: ['mattress'], region: 'IN' },
  { id: 'ro-service', name: 'RO Service', category: 'homeservices', color: '#0EA5E9', aliases: ['ro', 'water purifier', 'water filter amc'], region: 'IN' },
  { id: 'water-purifier-amc', name: 'Water Purifier AMC', category: 'homeservices', color: '#06B6D4', aliases: ['ro amc', 'water filter'], region: 'IN' },
  { id: 'ac-amc', name: 'AC AMC', category: 'homeservices', color: '#3B82F6', aliases: ['air conditioner amc', 'ac service'], region: 'GLOBAL' },
  { id: 'fridge-amc', name: 'Fridge AMC', category: 'homeservices', color: '#10B981', aliases: ['refrigerator amc', 'fridge service'], region: 'GLOBAL' },
  { id: 'washing-machine-amc', name: 'Washing Machine AMC', category: 'homeservices', color: '#8B5CF6', aliases: ['washing machine service'], region: 'GLOBAL' },
  { id: 'pest-control', name: 'Pest Control', category: 'homeservices', color: '#84CC16', aliases: ['pest service'], region: 'GLOBAL' },
  { id: 'home-security', name: 'Home Security', category: 'homeservices', color: '#0F172A', aliases: ['security alarm', 'home alarm'], region: 'GLOBAL' },
  { id: 'cloud-cctv', name: 'Cloud CCTV Storage', category: 'homeservices', color: '#475569', aliases: ['cctv', 'security camera'], region: 'GLOBAL' },
  { id: 'milk-delivery', name: 'Milk Delivery', category: 'homeservices', color: '#F8FAFC', aliases: ['country delight', 'milk basket', 'milk'], region: 'IN' },
  { id: 'newspaper-delivery', name: 'Newspaper Delivery', category: 'homeservices', color: '#1F2937', aliases: ['newspaper'], region: 'GLOBAL' },

  // ────────────────── Shopping ──────────────────
  { id: 'amazon-prime', name: 'Amazon Prime', category: 'shopping', color: '#00A8E1', aliases: ['prime', 'prime membership'], region: 'GLOBAL' },
  { id: 'costco', name: 'Costco', category: 'shopping', color: '#E31837', aliases: ['costco membership'], region: 'US' },
  { id: 'sams-club', name: "Sam's Club", category: 'shopping', color: '#0067A0', aliases: ['sams club'], region: 'US' },
  { id: 'walmart-plus', name: 'Walmart+', category: 'shopping', color: '#0071CE', aliases: ['walmart plus'], region: 'US' },
  { id: 'times-prime', name: 'Times Prime', category: 'shopping', color: '#D32F2F', aliases: ['times prime membership'], region: 'IN' },
  { id: 'flipkart-plus', name: 'Flipkart Plus', category: 'shopping', color: '#2874F0', aliases: ['flipkart'], region: 'IN' },
  { id: 'swiggy-one', name: 'Swiggy One', category: 'shopping', color: '#F1511B', aliases: ['swiggy'], region: 'IN' },
  { id: 'zomato-gold', name: 'Zomato Gold', category: 'shopping', color: '#EF4F5F', aliases: ['zomato'], region: 'IN' },
]

/**
 * Get a service from the catalog by its id
 */
export function getServiceById(id: string): CatalogService | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id)
}

/**
 * Search the catalog by name and aliases (case-insensitive substring match)
 */
export function searchCatalog(query: string): CatalogService[] {
  const q = query.trim().toLowerCase()
  if (!q) return SERVICE_CATALOG
  return SERVICE_CATALOG.filter((s) => {
    if (s.name.toLowerCase().includes(q)) return true
    if (s.aliases?.some((a) => a.toLowerCase().includes(q))) return true
    if (s.category.toLowerCase().includes(q)) return true
    return false
  })
}
