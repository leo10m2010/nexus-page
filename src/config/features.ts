export const features = {
  competition: { published: true },
};

export const showCompetition = features.competition.published || import.meta.env.DEV;
