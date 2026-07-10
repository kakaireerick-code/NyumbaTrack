/** True when running a production build (e.g. Vercel deploy). */
export const isDeployedApp = (): boolean => import.meta.env.PROD
