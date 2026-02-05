import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface ReviewDisplayProps {
  review: {
    id: string;
    rating: number;
    comment?: string | null;
    photoUrls?: string[] | null;
    createdAt: string | Date | null;
    foodQualityRating?: number | null;
    deliveryRating?: number | null;
    valueRating?: number | null;
    professionalismRating?: number | null;
    communicationRating?: number | null;
  };
  customerName?: string;
  customerImage?: string;
  type: "food" | "service";
}

export function ReviewDisplay({
  review,
  customerName = "Customer",
  customerImage,
  type,
}: ReviewDisplayProps) {
  const initials = customerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const detailedRatings =
    type === "food"
      ? [
          { label: "Food Quality", value: review.foodQualityRating },
          { label: "Delivery", value: review.deliveryRating },
          { label: "Value", value: review.valueRating },
        ]
      : [
          { label: "Professionalism", value: review.professionalismRating },
          { label: "Communication", value: review.communicationRating },
          { label: "Value", value: review.valueRating },
        ];

  const hasDetailedRatings = detailedRatings.some((r) => r.value);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={customerImage} alt={customerName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{customerName}</span>
              {review.createdAt && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="mt-1">
              <StarRating rating={review.rating} size="sm" />
            </div>

            {hasDetailedRatings && (
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                {detailedRatings.map(
                  (r) =>
                    r.value && (
                      <span key={r.label} className="flex items-center gap-1">
                        {r.label}:{" "}
                        <span className="font-medium text-foreground">{r.value}/5</span>
                      </span>
                    )
                )}
              </div>
            )}

            {review.comment && (
              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
            )}

            {review.photoUrls && review.photoUrls.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {review.photoUrls.map((url, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <button className="h-16 w-16 rounded-lg overflow-hidden border hover-elevate">
                        <img
                          src={url}
                          alt={`Review photo ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <img
                        src={url}
                        alt={`Review photo ${index + 1}`}
                        className="w-full h-auto rounded-lg"
                      />
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
