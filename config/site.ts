// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Site
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
interface SiteConfig {
  name: string
  title: string
  emoji: string
  description: string
  previewImg: string
  localeDefault: string
  links: {
    docs: string
    discord: string
    github: string
    twitter: string
  }
}

export const SITE_CANONICAL = 'https://turboeth.xyz'

export const siteConfig: SiteConfig = {
  name: 'MetIRL',
  title: 'MetIRL - EAS with ComposeDB',
  emoji: '⚡',
  description: 'Web3 App built using EAS with ComposeDB',
  previewImg: `${SITE_CANONICAL}/eas-summary.png`,
  localeDefault: 'en',
  links: {
    docs: '',
    discord: '',
    github: '',
    twitter: '',
  },
}
