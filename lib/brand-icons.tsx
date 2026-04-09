/**
 * Brand Icons System - Centralized service branding for subscriptions
 * Provides consistent icons, colors, and fallback behavior
 */

import { ReactNode } from 'react'

export interface BrandConfig {
  name: string
  displayName: string
  icon: ReactNode
  color: string
  textColor?: string
}

// Service icons as simple, clean SVG components
const NetflixIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/>
  </svg>
)

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

const ChatGPTIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const AmazonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.493.13.12.197.063.382-.177.556-.36.263-.756.527-1.191.784-1.29.77-2.71 1.368-4.259 1.795-1.526.414-3.07.62-4.632.62-2.127 0-4.159-.365-6.09-1.094-1.93-.728-3.69-1.756-5.277-3.085-.143-.122-.192-.283-.14-.485zm13.984-2.79c-.263.016-.489.017-.68.006l-.122-.007-.12-.003c-.178-.01-.266-.13-.236-.368l.005-.023.01-.035c.076-.247.248-.433.516-.56.31-.15.674-.27 1.09-.366.44-.1.887-.157 1.34-.167.343-.008.682.003 1.016.034.13.012.256.025.38.04a.473.473 0 0 1 .063.012l.05.01c.29.076.46.273.513.59.05.317.065.68.044 1.092-.02.38-.054.748-.098 1.103-.045.355-.1.696-.165 1.02-.064.325-.14.634-.224.928-.085.294-.177.567-.278.82-.101.253-.21.484-.326.693-.117.21-.242.396-.376.56-.133.164-.274.303-.424.417-.149.113-.306.2-.469.262-.163.062-.334.094-.51.094-.177 0-.35-.032-.52-.094-.17-.063-.334-.15-.493-.262-.16-.113-.311-.253-.455-.417-.144-.164-.28-.35-.407-.56-.128-.21-.247-.44-.358-.693-.111-.253-.213-.526-.306-.82-.094-.294-.177-.603-.25-.928-.073-.324-.134-.665-.183-1.02-.05-.355-.086-.723-.11-1.103-.022-.38-.03-.743.014-1.092.044-.348.173-.575.387-.682.212-.107.46-.143.742-.108.281.036.574.1.876.193.302.094.6.208.895.343.294.135.577.283.847.446.27.162.522.33.754.504l.207.16c.073.061.12.12.14.176.04.11.005.225-.105.344-.11.12-.25.217-.42.295-.17.078-.354.143-.552.194-.198.05-.4.088-.603.114l-.17.02zm-3.1 1.463c-.04.135-.104.253-.188.353-.084.1-.195.178-.333.233-.138.056-.296.083-.475.083-.18 0-.358-.03-.533-.093-.176-.062-.348-.142-.517-.242-.17-.1-.334-.215-.494-.344-.16-.13-.314-.265-.46-.407-.146-.143-.283-.29-.41-.44-.127-.15-.243-.302-.347-.453l-.155-.234c-.063-.092-.09-.19-.08-.294.01-.104.065-.198.165-.28.1-.084.223-.14.367-.17.145-.032.3-.036.468-.01.167.025.333.07.497.135.165.065.322.147.47.244.148.098.28.208.394.332l.094.104c.07.08.12.165.147.256zm-3.54 2.76c-.055.103-.125.19-.212.26-.086.07-.186.122-.3.156-.114.035-.238.053-.372.053-.134 0-.27-.018-.41-.053-.14-.035-.276-.088-.408-.158-.132-.07-.26-.155-.382-.255-.122-.1-.236-.213-.343-.34-.107-.127-.204-.264-.29-.41-.086-.147-.16-.302-.222-.464l-.09-.248c-.036-.103-.032-.195.012-.276.045-.08.12-.14.226-.178.107-.037.23-.044.37-.022.14.023.287.075.44.157.152.082.3.19.445.326.144.136.27.293.38.47l.078.137c.054.095.095.194.122.294zm.85-5.67c-.28-.075-.482-.218-.607-.427-.126-.21-.142-.444-.05-.702.093-.26.264-.464.516-.615.25-.15.534-.226.85-.226.315 0 .607.078.875.233.27.156.468.363.596.622.128.26.125.518-.01.774-.135.256-.35.44-.645.553-.294.114-.61.117-.946.007l-.58.58zm-6.007.61c-.055.103-.125.19-.212.26-.086.07-.186.122-.3.156-.114.035-.238.053-.372.053-.135 0-.27-.018-.41-.053-.14-.035-.276-.088-.408-.158-.132-.07-.26-.155-.382-.255-.122-.1-.237-.213-.343-.34-.107-.127-.204-.264-.29-.41-.086-.147-.16-.302-.222-.464l-.09-.248c-.036-.103-.032-.195.012-.276.045-.08.12-.14.226-.178.107-.037.23-.044.37-.022.14.023.287.075.44.157.152.082.3.19.445.326.144.136.27.293.38.47l.078.137c.054.095.095.194.122.294z"/>
  </svg>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
  </svg>
)

const DisneyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M1.089 11.473c0 .907 1.059 1.36 1.59 1.36.26 0 1.546-.42 2.106-.56a.148.148 0 0 0 .113-.144.146.146 0 0 0-.058-.117 12.48 12.48 0 0 1-1.52-1.72c-.493-.693-.84-1.347-.84-2.147 0-1.04.713-1.6 1.453-1.6.713 0 1.4.533 1.4 1.507 0 .76-.347 1.373-.607 1.88-.073.147.093.267.2.173a5.127 5.127 0 0 0 1.6-3.76c0-1.173-.6-2.16-2.2-2.16-1.76 0-3.58 1.653-3.58 4.107 0 .92.333 1.693.773 2.4-.6.16-1.167.32-1.36.4-.52.187-.6.34-.6.667 0 .327.24.66.887.66h.026c.38 0 .72-.04.707-.053-.007-.027.007-.187-.014-.2-.053-.027-.127.04-.267.053-.133.014-.293-.04-.293-.327 0-.3.353-.4.433-.42.187-.04.38-.08.56-.12.26.48.587.96.98 1.44-.74.24-1.727.6-2.453.907-.22.093-.56.28-.56.673 0 .573.82.953 1.94.953 1.04 0 2-.507 2.507-1.467.387.307.807.587 1.253.84.76.427 1.88.8 3.04.8 2.6 0 4.387-1.493 4.387-3.4 0-1.587-1.147-2.627-2.58-3.12a.145.145 0 0 0-.18.08.148.148 0 0 0 .043.173c.627.5 1.013 1.16 1.013 2.04 0 1.36-1.027 2.52-2.853 2.52-1.2 0-2.347-.507-3.227-1.16.48-.867.7-1.907.7-3.133 0-2.987-1.6-6.16-4.72-6.16-2.92 0-5.107 2.52-5.107 5.827 0 .387.027.76.08 1.12-.667.16-1.293.34-1.84.533-.92.327-1.32.72-1.32 1.293zM4.667 15.8c-.64 0-.947-.307-.947-.567 0-.187.133-.347.36-.467.573-.28 1.267-.52 1.907-.72.667.733 1.44 1.36 2.267 1.88-.387.52-1.053.867-2.053.867H4.56l.107.007zm6.893-5.227c0 .807-.147 1.547-.44 2.187-.507-.38-.96-.827-1.36-1.32.327-.52.527-1.18.527-2.027 0-1.947-1.107-3.693-2.587-4.987l.007-.02c.04-.16.167-.247.353-.247 1.893 0 3.5 2.8 3.5 6.414z"/>
  </svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
  </svg>
)

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.234 4.764 7.28v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM2.778 1.408l13.59-.933c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.654.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.948c0-.84.374-1.54 1.167-1.54z"/>
  </svg>
)

const CanvaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.91 9.236c-.146.223-.34.412-.568.555a1.4 1.4 0 0 1-.766.214c-.27 0-.52-.077-.75-.228a1.75 1.75 0 0 1-.544-.585 4.68 4.68 0 0 0-.617-.846 2.32 2.32 0 0 0-.742-.576c-.283-.14-.62-.21-1.005-.21-.546 0-1.048.153-1.5.456a3.36 3.36 0 0 0-1.106 1.19c-.285.492-.47 1.04-.55 1.64a6.16 6.16 0 0 0-.054 1.12c.03.608.117 1.16.258 1.65.14.49.348.913.62 1.264.273.35.612.625 1.01.82.4.195.862.292 1.38.292.444 0 .84-.08 1.182-.24.343-.16.638-.364.882-.61.244-.247.445-.518.6-.81.156-.293.27-.575.343-.844l.024-.082c.05-.17.114-.3.193-.385a.4.4 0 0 1 .304-.128c.177 0 .32.08.43.242.11.16.166.378.166.65a3.45 3.45 0 0 1-.2 1.107 4.16 4.16 0 0 1-.597 1.094c-.26.347-.6.642-1.02.883-.42.24-.92.428-1.5.563a7.9 7.9 0 0 1-1.88.203c-.807 0-1.55-.127-2.224-.38a5.14 5.14 0 0 1-1.76-1.088 4.97 4.97 0 0 1-1.153-1.706c-.28-.67-.42-1.416-.42-2.238 0-.824.14-1.593.42-2.306a5.23 5.23 0 0 1 1.173-1.85 5.45 5.45 0 0 1 1.8-1.232A5.71 5.71 0 0 1 12 6.7c.704 0 1.326.107 1.866.32.54.213.996.492 1.366.836.37.345.655.722.854 1.13.2.41.298.81.298 1.2 0 .365-.082.684-.244.958z"/>
  </svg>
)

const AdobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425H13.966zM8.884 1.376H0v21.248zm15.116 0H15.12l8.88 21.248z"/>
  </svg>
)

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z"/>
  </svg>
)

const HBOIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M7.042 16.896H4.414v-3.754H2.708v3.754H.038V7.104h2.67v3.443h1.706V7.104h2.628zm9.638-4.897h-2.65v-1.953h2.65zm-2.65 1.953h2.65v2.944h-2.65zM4.414 7.104h2.628v2.944H4.414zM21.34 7.104h2.622v9.792H21.34zM21.34 7.104h-3.648v9.792h3.648zM9.654 7.104h3.648v9.792H9.654zM9.654 7.104v9.792h3.648V7.104z"/>
  </svg>
)

const HuluIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M2.4 4.8c-1.32 0-2.4 1.08-2.4 2.4v9.6c0 1.32 1.08 2.4 2.4 2.4h19.2c1.32 0 2.4-1.08 2.4-2.4V7.2c0-1.32-1.08-2.4-2.4-2.4zm2.316 4.188h1.776v5.988h1.704V8.988h1.8v7.08H5.724V13.2h-1.8v2.868H2.124V8.988zm10.188 0c.996 0 1.8.804 1.8 1.8v4.188h-1.8V10.98c0-.33-.27-.6-.6-.6s-.6.27-.6.6v3.996h-1.8V8.988zm2.4 0h1.8v5.988h.6c.33 0 .6-.27.6-.6V8.988h1.8v5.388c0 .996-.804 1.8-1.8 1.8h-3z"/>
  </svg>
)

const DropboxIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="m6 2 6 3.75L6 9.5 0 5.75zm12 0 6 3.75-6 3.75-6-3.75zm-12 11.5 6-3.75 6 3.75-6 3.75zm12 0 6-3.75v3.75l-6 3.75-6-3.75v-3.75zm-12 0L0 9.75v3.75l6 3.75 6-3.75-6-3.75z"/>
  </svg>
)

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
)

const FigmaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zM8.148 24c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.588 4.539zm-.001-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02c1.681 0 3.059-1.385 3.059-3.07v-2.969H8.147zM8.148 8.981c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981H8.148zm0-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V1.471H8.148zM8.172 15.019c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.564v8.981H8.172zm-.001-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.093V7.51H8.171zM15.852 15.019c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49 4.49 2.014 4.49 4.49-2.014 4.49-4.49 4.49zm0-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.354-3.019-3.019-3.019z"/>
  </svg>
)

const ZoomIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-4.35-3.712c-.095-.175-.266-.288-.449-.288h-3.576c-.346 0-.628.284-.628.634v6.732c0 .35.282.634.628.634h3.576c.183 0 .354-.113.449-.288a.646.646 0 0 0 0-.58l-1.452-2.726c-.19-.358-.19-.776 0-1.132l1.452-2.406a.646.646 0 0 0 0-.58zM4.35 15.712c.095.175.266.288.449.288h10.176c.346 0 .628-.284.628-.634V8.634A.631.631 0 0 0 14.975 8H4.799c-.183 0-.354.113-.449.288a.646.646 0 0 0 0 .58l1.452 2.726c.19.358.19.776 0 1.132l-1.452 2.406a.646.646 0 0 0 0 .58z"/>
  </svg>
)

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
)

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
  </svg>
)

const PlayStationIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.778.029 5.418.713 1.845.619 2.048 1.541 1.589 2.177-.462.639-1.608 1.109-1.608 1.109l-8.532 3.047v-2.491zM.078 18.667c-.086.65.264 1.347 1.161 1.744 1.932.853 4.919 1.178 7.276.42l.038-.015v-2.317l-5.09 1.623c-.72.262-1.39.319-1.972.126-.583-.192-.556-.625.123-.886l6.919-2.476v-2.502l-9.68 3.456c-.18.064-.353.13-.521.198a3.865 3.865 0 00-.242.104l-.012.005a3.955 3.955 0 00-.198.09l.198-.52z"/>
  </svg>
)

// Brand configuration map - normalized service names to brand config
const brandMap: Record<string, BrandConfig> = {
  // Streaming
  netflix: {
    name: 'netflix',
    displayName: 'Netflix',
    icon: <NetflixIcon />,
    color: '#E50914',
    textColor: '#FFFFFF',
  },
  spotify: {
    name: 'spotify',
    displayName: 'Spotify',
    icon: <SpotifyIcon />,
    color: '#1DB954',
    textColor: '#FFFFFF',
  },
  youtube: {
    name: 'youtube',
    displayName: 'YouTube',
    icon: <YouTubeIcon />,
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  'youtube premium': {
    name: 'youtube premium',
    displayName: 'YouTube Premium',
    icon: <YouTubeIcon />,
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  'youtube music': {
    name: 'youtube music',
    displayName: 'YouTube Music',
    icon: <YouTubeIcon />,
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  disney: {
    name: 'disney',
    displayName: 'Disney+',
    icon: <DisneyIcon />,
    color: '#113CCF',
    textColor: '#FFFFFF',
  },
  'disney+': {
    name: 'disney+',
    displayName: 'Disney+',
    icon: <DisneyIcon />,
    color: '#113CCF',
    textColor: '#FFFFFF',
  },
  'disney plus': {
    name: 'disney plus',
    displayName: 'Disney+',
    icon: <DisneyIcon />,
    color: '#113CCF',
    textColor: '#FFFFFF',
  },
  hotstar: {
    name: 'hotstar',
    displayName: 'Hotstar',
    icon: <DisneyIcon />,
    color: '#113CCF',
    textColor: '#FFFFFF',
  },
  'amazon prime': {
    name: 'amazon prime',
    displayName: 'Amazon Prime',
    icon: <AmazonIcon />,
    color: '#00A8E1',
    textColor: '#FFFFFF',
  },
  'prime video': {
    name: 'prime video',
    displayName: 'Prime Video',
    icon: <AmazonIcon />,
    color: '#00A8E1',
    textColor: '#FFFFFF',
  },
  amazon: {
    name: 'amazon',
    displayName: 'Amazon',
    icon: <AmazonIcon />,
    color: '#FF9900',
    textColor: '#232F3E',
  },
  hbo: {
    name: 'hbo',
    displayName: 'HBO Max',
    icon: <HBOIcon />,
    color: '#5822B4',
    textColor: '#FFFFFF',
  },
  'hbo max': {
    name: 'hbo max',
    displayName: 'HBO Max',
    icon: <HBOIcon />,
    color: '#5822B4',
    textColor: '#FFFFFF',
  },
  hulu: {
    name: 'hulu',
    displayName: 'Hulu',
    icon: <HuluIcon />,
    color: '#1CE783',
    textColor: '#040405',
  },
  twitch: {
    name: 'twitch',
    displayName: 'Twitch',
    icon: <TwitchIcon />,
    color: '#9146FF',
    textColor: '#FFFFFF',
  },
  
  // Gaming
  discord: {
    name: 'discord',
    displayName: 'Discord',
    icon: <DiscordIcon />,
    color: '#5865F2',
    textColor: '#FFFFFF',
  },
  'discord nitro': {
    name: 'discord nitro',
    displayName: 'Discord Nitro',
    icon: <DiscordIcon />,
    color: '#5865F2',
    textColor: '#FFFFFF',
  },
  playstation: {
    name: 'playstation',
    displayName: 'PlayStation',
    icon: <PlayStationIcon />,
    color: '#003791',
    textColor: '#FFFFFF',
  },
  'playstation plus': {
    name: 'playstation plus',
    displayName: 'PlayStation Plus',
    icon: <PlayStationIcon />,
    color: '#003791',
    textColor: '#FFFFFF',
  },
  'ps plus': {
    name: 'ps plus',
    displayName: 'PlayStation Plus',
    icon: <PlayStationIcon />,
    color: '#003791',
    textColor: '#FFFFFF',
  },

  // Apple
  apple: {
    name: 'apple',
    displayName: 'Apple',
    icon: <AppleIcon />,
    color: '#000000',
    textColor: '#FFFFFF',
  },
  'apple music': {
    name: 'apple music',
    displayName: 'Apple Music',
    icon: <AppleIcon />,
    color: '#FA233B',
    textColor: '#FFFFFF',
  },
  'apple one': {
    name: 'apple one',
    displayName: 'Apple One',
    icon: <AppleIcon />,
    color: '#000000',
    textColor: '#FFFFFF',
  },
  'apple tv': {
    name: 'apple tv',
    displayName: 'Apple TV+',
    icon: <AppleIcon />,
    color: '#000000',
    textColor: '#FFFFFF',
  },
  'apple tv+': {
    name: 'apple tv+',
    displayName: 'Apple TV+',
    icon: <AppleIcon />,
    color: '#000000',
    textColor: '#FFFFFF',
  },
  icloud: {
    name: 'icloud',
    displayName: 'iCloud',
    icon: <AppleIcon />,
    color: '#3693F3',
    textColor: '#FFFFFF',
  },
  'icloud+': {
    name: 'icloud+',
    displayName: 'iCloud+',
    icon: <AppleIcon />,
    color: '#3693F3',
    textColor: '#FFFFFF',
  },

  // AI & Productivity
  chatgpt: {
    name: 'chatgpt',
    displayName: 'ChatGPT',
    icon: <ChatGPTIcon />,
    color: '#10A37F',
    textColor: '#FFFFFF',
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    icon: <ChatGPTIcon />,
    color: '#10A37F',
    textColor: '#FFFFFF',
  },
  'chatgpt plus': {
    name: 'chatgpt plus',
    displayName: 'ChatGPT Plus',
    icon: <ChatGPTIcon />,
    color: '#10A37F',
    textColor: '#FFFFFF',
  },
  notion: {
    name: 'notion',
    displayName: 'Notion',
    icon: <NotionIcon />,
    color: '#000000',
    textColor: '#FFFFFF',
  },
  canva: {
    name: 'canva',
    displayName: 'Canva',
    icon: <CanvaIcon />,
    color: '#00C4CC',
    textColor: '#FFFFFF',
  },
  'canva pro': {
    name: 'canva pro',
    displayName: 'Canva Pro',
    icon: <CanvaIcon />,
    color: '#00C4CC',
    textColor: '#FFFFFF',
  },
  figma: {
    name: 'figma',
    displayName: 'Figma',
    icon: <FigmaIcon />,
    color: '#F24E1E',
    textColor: '#FFFFFF',
  },
  zoom: {
    name: 'zoom',
    displayName: 'Zoom',
    icon: <ZoomIcon />,
    color: '#2D8CFF',
    textColor: '#FFFFFF',
  },
  slack: {
    name: 'slack',
    displayName: 'Slack',
    icon: <SlackIcon />,
    color: '#4A154B',
    textColor: '#FFFFFF',
  },
  dropbox: {
    name: 'dropbox',
    displayName: 'Dropbox',
    icon: <DropboxIcon />,
    color: '#0061FF',
    textColor: '#FFFFFF',
  },

  // Google
  google: {
    name: 'google',
    displayName: 'Google',
    icon: <GoogleIcon />,
    color: '#4285F4',
    textColor: '#FFFFFF',
  },
  'google one': {
    name: 'google one',
    displayName: 'Google One',
    icon: <GoogleIcon />,
    color: '#4285F4',
    textColor: '#FFFFFF',
  },
  'google drive': {
    name: 'google drive',
    displayName: 'Google Drive',
    icon: <GoogleIcon />,
    color: '#4285F4',
    textColor: '#FFFFFF',
  },
  'google workspace': {
    name: 'google workspace',
    displayName: 'Google Workspace',
    icon: <GoogleIcon />,
    color: '#4285F4',
    textColor: '#FFFFFF',
  },

  // Adobe
  adobe: {
    name: 'adobe',
    displayName: 'Adobe',
    icon: <AdobeIcon />,
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  'creative cloud': {
    name: 'creative cloud',
    displayName: 'Adobe CC',
    icon: <AdobeIcon />,
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  'adobe creative cloud': {
    name: 'adobe creative cloud',
    displayName: 'Adobe CC',
    icon: <AdobeIcon />,
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  photoshop: {
    name: 'photoshop',
    displayName: 'Photoshop',
    icon: <AdobeIcon />,
    color: '#31A8FF',
    textColor: '#FFFFFF',
  },
  illustrator: {
    name: 'illustrator',
    displayName: 'Illustrator',
    icon: <AdobeIcon />,
    color: '#FF9A00',
    textColor: '#FFFFFF',
  },
  lightroom: {
    name: 'lightroom',
    displayName: 'Lightroom',
    icon: <AdobeIcon />,
    color: '#31A8FF',
    textColor: '#FFFFFF',
  },

  // Microsoft
  microsoft: {
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: <MicrosoftIcon />,
    color: '#00A4EF',
    textColor: '#FFFFFF',
  },
  'microsoft 365': {
    name: 'microsoft 365',
    displayName: 'Microsoft 365',
    icon: <MicrosoftIcon />,
    color: '#00A4EF',
    textColor: '#FFFFFF',
  },
  office: {
    name: 'office',
    displayName: 'Office 365',
    icon: <MicrosoftIcon />,
    color: '#D83B01',
    textColor: '#FFFFFF',
  },
  'office 365': {
    name: 'office 365',
    displayName: 'Office 365',
    icon: <MicrosoftIcon />,
    color: '#D83B01',
    textColor: '#FFFFFF',
  },
  onedrive: {
    name: 'onedrive',
    displayName: 'OneDrive',
    icon: <MicrosoftIcon />,
    color: '#0078D4',
    textColor: '#FFFFFF',
  },
  xbox: {
    name: 'xbox',
    displayName: 'Xbox',
    icon: <MicrosoftIcon />,
    color: '#107C10',
    textColor: '#FFFFFF',
  },
  'xbox game pass': {
    name: 'xbox game pass',
    displayName: 'Xbox Game Pass',
    icon: <MicrosoftIcon />,
    color: '#107C10',
    textColor: '#FFFFFF',
  },

  // Developer
  github: {
    name: 'github',
    displayName: 'GitHub',
    icon: <GitHubIcon />,
    color: '#181717',
    textColor: '#FFFFFF',
  },
  'github copilot': {
    name: 'github copilot',
    displayName: 'GitHub Copilot',
    icon: <GitHubIcon />,
    color: '#181717',
    textColor: '#FFFFFF',
  },
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    icon: <LinkedInIcon />,
    color: '#0A66C2',
    textColor: '#FFFFFF',
  },
  'linkedin premium': {
    name: 'linkedin premium',
    displayName: 'LinkedIn Premium',
    icon: <LinkedInIcon />,
    color: '#0A66C2',
    textColor: '#FFFFFF',
  },
}

/**
 * Normalize a service name for lookup
 */
export function normalizeServiceName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Get brand configuration for a service
 * @returns BrandConfig if found, null if unknown
 */
export function getBrandConfig(serviceName: string): BrandConfig | null {
  const normalized = normalizeServiceName(serviceName)
  return brandMap[normalized] || null
}

/**
 * Check if a service has brand configuration
 */
export function hasBrandIcon(serviceName: string): boolean {
  return getBrandConfig(serviceName) !== null
}

/**
 * Get brand icon component for a service
 * Returns null if no brand icon exists (use fallback)
 */
export function getBrandIcon(serviceName: string): ReactNode | null {
  const config = getBrandConfig(serviceName)
  return config?.icon || null
}

/**
 * Get brand color for a service
 * Returns null if unknown (use fallback color)
 */
export function getBrandColor(serviceName: string): string | null {
  const config = getBrandConfig(serviceName)
  return config?.color || null
}

/**
 * Get all supported brand names (for reference)
 */
export function getSupportedBrands(): string[] {
  return Object.values(brandMap).map((b) => b.displayName)
}

/**
 * Premium fallback badge with initials
 */
export function FallbackBadge({
  name,
  color,
  size = 'md',
}: {
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('')

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: color || '#6B7280' }}
    >
      {initials || '?'}
    </div>
  )
}

/**
 * Smart subscription icon component
 * Renders brand icon if available, else premium fallback
 */
export function SubscriptionIcon({
  name,
  fallbackColor,
  size = 'md',
}: {
  name: string
  fallbackColor?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const brandConfig = getBrandConfig(name)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (brandConfig) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shrink-0`}
        style={{ backgroundColor: brandConfig.color }}
      >
        <div className={`${iconSizeClasses[size]}`} style={{ color: brandConfig.textColor || '#FFFFFF' }}>
          {brandConfig.icon}
        </div>
      </div>
    )
  }

  return <FallbackBadge name={name} color={fallbackColor} size={size} />
}
