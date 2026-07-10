declare const __BUILD_SHA__: string | undefined
declare const __BUILD_TIME__: string | undefined

export type BuildInfo = {
  sha: string
  builtAt: string
}

export const getBuildInfo = (): BuildInfo => ({
  sha: typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : 'dev',
  builtAt: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '',
})

/** Quick check that production is serving this repo (not the old marketing site). */
export const isRbacBuild = (): boolean => getBuildInfo().sha !== 'dev'
