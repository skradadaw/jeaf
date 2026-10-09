type RankableParticipant = {
  nomor_urut: number;
  total_nilai: number | null;
};

export type RankedParticipant<T> = {
  participant: T;
  rank: number | null;
};

export const rankParticipantsByFinalScore = <T extends RankableParticipant>(participants: T[]): RankedParticipant<T>[] => {
  const sortedParticipants = [...participants].sort((first, second) =>
    (second.total_nilai ?? Number.NEGATIVE_INFINITY) - (first.total_nilai ?? Number.NEGATIVE_INFINITY)
      || first.nomor_urut - second.nomor_urut
  );

  let scoredPosition = 0;
  let previousScore: number | null = null;
  let previousRank = 0;

  return sortedParticipants.map((participant) => {
    if (participant.total_nilai === null) return { participant, rank: null };

    scoredPosition += 1;
    if (previousScore === null || participant.total_nilai !== previousScore) {
      previousScore = participant.total_nilai;
      previousRank = scoredPosition;
    }

    return { participant, rank: previousRank };
  });
};
