export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  taskTypes: string[];
  accuracy: number;
  speed: number;
  cost: number;
  privacy: number;
  easeOfUse: number;
  hardware: string;
  license: string;
  benchmarkSource: string;
}

export type AIModelDocument = Omit<AIModel, "id"> & {
  id?: string;
};
