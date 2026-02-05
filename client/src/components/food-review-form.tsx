import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/star-rating";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, X, Loader2 } from "lucide-react";

interface FoodReviewFormProps {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FoodReviewForm({
  orderId,
  restaurantId,
  restaurantName,
  onSuccess,
  onCancel,
}: FoodReviewFormProps) {
  const { toast } = useToast();
  const [overallRating, setOverallRating] = useState(0);
  const [foodQualityRating, setFoodQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const submitMutation = useMutation({
    mutationFn: async (data: {
      orderId: string;
      restaurantId: string;
      rating: number;
      foodQualityRating?: number;
      deliveryRating?: number;
      valueRating?: number;
      comment?: string;
      photoUrls?: string[];
    }) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId, "reviews"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overallRating === 0) {
      toast({ title: "Rating Required", description: "Please select an overall rating", variant: "destructive" });
      return;
    }

    submitMutation.mutate({
      orderId,
      restaurantId,
      rating: overallRating,
      foodQualityRating: foodQualityRating || undefined,
      deliveryRating: deliveryRating || undefined,
      valueRating: valueRating || undefined,
      comment: comment || undefined,
      photoUrls: photos.length > 0 ? photos : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Your Order</CardTitle>
        <CardDescription>Share your experience with {restaurantName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Overall Rating *</Label>
              <div className="mt-2">
                <StarRating
                  rating={overallRating}
                  size="lg"
                  interactive
                  onChange={setOverallRating}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <StarRating
                rating={foodQualityRating}
                interactive
                onChange={setFoodQualityRating}
                label="Food Quality"
              />
              <StarRating
                rating={deliveryRating}
                interactive
                onChange={setDeliveryRating}
                label="Delivery"
              />
              <StarRating
                rating={valueRating}
                interactive
                onChange={setValueRating}
                label="Value for Money"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Review (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              data-testid="input-review-comment"
            />
          </div>

          <div className="space-y-2">
            <Label>Add Photos (Optional)</Label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    data-testid={`button-remove-photo-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="h-20 w-20 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="input-photo-upload"
                  />
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Upload up to 5 photos</p>
          </div>

          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-review">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={submitMutation.isPending} data-testid="button-submit-review">
              {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
