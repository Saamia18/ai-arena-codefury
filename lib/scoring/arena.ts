import type { AIModel } from "@/types/ai-model";
import type { AIWeights, ArenaRanking } from "@/types/api";
import { roundScore, WEIGHT_DIMENSIONS } from "@/lib/scoring/weights";

export function rankModels(models: AIModel[], weights: AIWeights): ArenaRanking[] {
  return models
    .map((model) => {
      const breakdown = {
        accuracy: roundScore(model.accuracy * weights.accuracy),
        speed: roundScore(model.speed * weights.speed),
        cost: roundScore(model.cost * weights.cost),
        privacy: roundScore(model.privacy * weights.privacy),
        easeOfUse: roundScore(model.easeOfUse * weights.easeOfUse),
      };
      const score = roundScore(
        WEIGHT_DIMENSIONS.reduce(
          (total, dimension) => total + breakdown[dimension],
          0,
        ),
      );

      return {
        rank: 0,
        modelId: model.id,
        name: model.name,
        provider: model.provider,
        description: model.description,
        taskTypes: model.taskTypes,
        hardware: model.hardware,
        license: model.license,
        benchmarkSource: model.benchmarkSource,
        score,
        breakdown,
      };
    })
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return first.name.localeCompare(second.name);
    })
    .map((ranking, index) => ({
      ...ranking,
      rank: index + 1,
    }));
}
