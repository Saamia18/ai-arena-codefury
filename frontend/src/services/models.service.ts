import { arenaModels } from '../data/home'
export type ArenaModel = (typeof arenaModels)[number]
/** Swap this mock for apiClient<ArenaModel[]>('/models') after the API contract is agreed. */
export const getFeaturedModels = async (): Promise<ArenaModel[]> => Promise.resolve(arenaModels)
