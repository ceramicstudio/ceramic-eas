import { z } from 'zod'

const server = z.object({
  // Iron session requires a secret of at least 32 characters
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXTAUTH_SECRET: z.string().min(32).default('complex_password_at_least_32_characters_long'),
  DATABASE_URL: z.string().url().optional(),
  AUTHOR_KEY: z.string().min(1),
  // Comma separated list of Ethereum addresses, accepts optinal whitespace after comma
  APP_ADMINS: z
    .string()
    .regex(/^(0x[a-fA-F0-9]{40}( *, *0x[a-fA-F0-9]{40})* *)*$/)
    .optional(),
  SITE_URL: z.string().url().optional(),
})

const client = z.object({
  NEXT_PUBLIC_USE_PUBLIC_PROVIDER: z.enum(['true', 'false']).default('true'),
  NEXT_PUBLIC_USE_HARDHAT_PROVIDER: z.enum(['true', 'false']).default('false'),
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_INFURA_API_KEY: z.string().min(1).optional(),
  REACT_APP_ALCHEMY_API_KEY: z.string().min(1).optional(),
  REACT_APP_CHAIN_ID: z.string().min(1).optional(),
})

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  APP_ADMINS: process.env.APP_ADMINS,
  SITE_URL: process.env.SITE_URL,
  NEXT_PUBLIC_USE_PUBLIC_PROVIDER: process.env.NEXT_PUBLIC_USE_PUBLIC_PROVIDER,
  NEXT_PUBLIC_USE_HARDHAT_PROVIDER: process.env.NEXT_PUBLIC_USE_HARDHAT_PROVIDER,
  NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  NEXT_PUBLIC_INFURA_API_KEY: process.env.NEXT_PUBLIC_INFURA_API_KEY,
  REACT_APP_ALCHEMY_API_KEY: process.env.REACT_APP_ALCHEMY_API_KEY,
  REACT_APP_CHAIN_ID: process.env.REACT_APP_CHAIN_ID,
  AUTHOR_KEY: process.env.AUTHOR_KEY,
}

const merged = server.merge(client)

/** @typedef {z.input<typeof merged>} MergedInput */
/** @typedef {z.infer<typeof merged>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

let env = process.env

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === 'undefined'

  const parsed = isServer
    ? merged.safeParse(processEnv) // on server we can validate all env vars
    : client.safeParse(processEnv) // on client we can only validate the ones that are exposed

  if (parsed.success === false) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith('NEXT_PUBLIC_'))
        throw new Error(
          process.env.NODE_ENV === 'production'
            ? '❌ Attempted to access a server-side environment variable on the client'
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`
        )
      return target[/** @type {keyof typeof target} */ (prop)]
    },
  })
}

export { env }
