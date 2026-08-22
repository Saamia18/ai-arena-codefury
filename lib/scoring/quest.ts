import type { AIProfile, QuestAnswer, WeightDimension } from "@/types/api";
import {
  createEmptyWeights,
  isWeightDimension,
  WEIGHT_DIMENSIONS,
} from "@/lib/scoring/weights";

type QuestAnswerOption = {
  id: string;
  points: Partial<Record<WeightDimension, number>>;
};

type QuestQuestion = {
  id: string;
  options: QuestAnswerOption[];
};

const PROFILE_SCALE = 1000;

export const questQuestions: QuestQuestion[] = [
  {
    id: "q1",
    options: [
      { id: "accuracy", points: { accuracy: 5 } },
      { id: "speed", points: { speed: 5 } },
      { id: "cost", points: { cost: 5 } },
    ],
  },
  {
    id: "q2",
    options: [
      { id: "realtime", points: { speed: 5 } },
      { id: "balanced", points: { speed: 2, accuracy: 3 } },
      { id: "deliberate", points: { accuracy: 5 } },
    ],
  },
  {
    id: "q3",
    options: [
      { id: "lean", points: { cost: 5 } },
      { id: "balanced", points: { cost: 2, accuracy: 2, speed: 1 } },
      { id: "premium", points: { accuracy: 4, easeOfUse: 1 } },
    ],
  },
  {
    id: "q4",
    options: [
      { id: "standard", points: { easeOfUse: 3, cost: 2 } },
      { id: "sensitive", points: { privacy: 3, accuracy: 2 } },
      { id: "private", points: { privacy: 5 } },
    ],
  },
  {
    id: "q5",
    options: [
      { id: "developers", points: { accuracy: 3, speed: 2 } },
      { id: "teams", points: { easeOfUse: 3, accuracy: 2 } },
      { id: "everyone", points: { easeOfUse: 5 } },
    ],
  },
];

export function buildAIProfile(answers: unknown): AIProfile {
  const validatedAnswers = validateQuestAnswers(answers);
  const scores = createEmptyWeights();

  for (const answer of validatedAnswers) {
    const question = getQuestion(answer.questionId);
    const option = question.options.find(({ id }) => id === answer.answer);

    if (!option) {
      throw new Error(
        `Invalid answer '${answer.answer}' for question '${answer.questionId}'`,
      );
    }

    for (const [dimension, points] of Object.entries(option.points)) {
      if (!isWeightDimension(dimension) || typeof points !== "number") {
        continue;
      }

      scores[dimension] += points;
    }
  }

  return normalizeScores(scores);
}

function validateQuestAnswers(value: unknown): QuestAnswer[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("answers must be a non-empty array");
  }

  const seenQuestionIds = new Set<string>();

  return value.map((answer, index) => {
    if (!isObject(answer)) {
      throw new Error(`answers[${index}] must be an object`);
    }

    if (typeof answer.questionId !== "string" || !answer.questionId) {
      throw new Error(`answers[${index}].questionId is required`);
    }

    if (typeof answer.answer !== "string" || !answer.answer) {
      throw new Error(`answers[${index}].answer is required`);
    }

    getQuestion(answer.questionId);

    if (seenQuestionIds.has(answer.questionId)) {
      throw new Error(`Duplicate answer for question '${answer.questionId}'`);
    }

    seenQuestionIds.add(answer.questionId);

    return {
      questionId: answer.questionId,
      answer: answer.answer,
    };
  });
}

function getQuestion(questionId: string) {
  const question = questQuestions.find(({ id }) => id === questionId);

  if (!question) {
    throw new Error(`Unknown question '${questionId}'`);
  }

  return question;
}

function normalizeScores(scores: AIProfile): AIProfile {
  const totalScore = WEIGHT_DIMENSIONS.reduce(
    (total, dimension) => total + scores[dimension],
    0,
  );

  if (totalScore <= 0) {
    throw new Error("answers did not produce a valid profile");
  }

  const scaledWeights = WEIGHT_DIMENSIONS.map((dimension) => {
    const exact = (scores[dimension] / totalScore) * PROFILE_SCALE;

    return {
      dimension,
      base: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  const baseTotal = scaledWeights.reduce((total, weight) => total + weight.base, 0);
  let remainingPoints = PROFILE_SCALE - baseTotal;

  const sortedByRemainder = [...scaledWeights].sort((first, second) => {
    if (second.remainder !== first.remainder) {
      return second.remainder - first.remainder;
    }

    return (
      WEIGHT_DIMENSIONS.indexOf(first.dimension) -
      WEIGHT_DIMENSIONS.indexOf(second.dimension)
    );
  });

  for (const weight of sortedByRemainder) {
    if (remainingPoints <= 0) {
      break;
    }

    weight.base += 1;
    remainingPoints -= 1;
  }

  const normalized = createEmptyWeights();

  for (const weight of scaledWeights) {
    normalized[weight.dimension] = weight.base / PROFILE_SCALE;
  }

  return normalized;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
