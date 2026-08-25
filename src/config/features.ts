/**
 * Build-time feature flags.
 *
 * `published: false` means the page is NOT generated when you run
 * `npm run build`. It does not exist in the output, so nobody can reach it,
 * not even with the direct URL. You still see it locally with `npm run dev`.
 *
 * To publish: change `published` to true, rebuild, upload.
 */
export const features = {
  competition: { published: false },
};

/** Visible while developing, gated in the build until the flag is flipped. */
export const showCompetition = features.competition.published || import.meta.env.DEV;
