/**
 * Two providers, picked from the key prefix.
 *
 * Anthropic keys are `sk-ant-…`; DeepSeek keys are `sk-` followed by hex.
 * DeepSeek also serves an Anthropic-Messages-shaped endpoint, so the same
 * request body works against both — only the host, model and one header differ.
 *
 * Verified from a browser origin: DeepSeek returns CORS headers for a `file://`
 * page, so it is reachable directly with no proxy. Anthropic needs the explicit
 * dangerous-direct-browser-access opt-in instead.
 *
 * The key itself is NEVER part of this file. It is pasted at demo time and kept
 * in localStorage under `bc-remi-key`. Do not move it to an `import.meta.env.*`
 * variable: Vite inlines any `VITE_`-prefixed variable into the public bundle at
 * build time, which would publish the key in the JavaScript every visitor
 * downloads.
 */
export type ProviderId = 'anthropic' | 'deepseek'

export interface Provider {
  label: string
  url: string
  model: string
  headers: (key: string) => Record<string, string>
}

export const REMI_PROVIDERS: Record<ProviderId, Provider> = {
  anthropic: {
    label: 'Claude',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-opus-4-8',
    headers(k) {
      return {
        'x-api-key': k,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        // Required for a browser origin.
        'anthropic-dangerous-direct-browser-access': 'true',
      }
    },
  },
  deepseek: {
    label: 'DeepSeek',
    // deepseek-chat is the stable alias; it resolves to deepseek-v4-flash.
    // Asking for deepseek-v4-flash by name returned an empty completion, so the
    // alias it is.
    url: 'https://api.deepseek.com/anthropic/v1/messages',
    model: 'deepseek-chat',
    headers(k) {
      return {
        'x-api-key': k,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      }
    },
  },
}

export const remiProviderOf = (k: string): ProviderId =>
  /^sk-ant-/.test(String(k || '')) ? 'anthropic' : 'deepseek'

/** Where the pasted key lives. Never written to the repo, never bundled. */
export const REMI_KEY_SLOT = 'bc-remi-key'
