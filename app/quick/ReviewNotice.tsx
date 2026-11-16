export type RewriteReviewNotice = {
  status: "completed" | "unavailable";
  issues: string[];
};

export function ReviewNotice({ review }: { review: RewriteReviewNotice | null }) {
  if (!review || (review.status === "completed" && review.issues.length === 0)) return null;

  return (
    <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">
      {review.status === "unavailable" && (
        <p>Automated meaning review was unavailable. Check factual details manually.</p>
      )}
      {review.issues.length > 0 && (
        <>
          <p className="font-semibold">Please review these possible meaning issues:</p>
          <ul className="mt-1 list-disc pl-5">
            {review.issues.map((issue, index) => <li key={`${index}-${issue}`}>{issue}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
