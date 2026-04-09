import { useQuery } from "@tanstack/react-query";
import { Heart, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SuccessStory, Animal } from "@shared/schema";
import CatPawLogo from "@/components/CatPawLogo";

type StoryWithAnimal = SuccessStory & { animal?: Animal };

export default function SuccessStoriesPage() {
  const { data: stories = [], isLoading } = useQuery<StoryWithAnimal[]>({
    queryKey: ["/api/success-stories"],
  });

  return (
    <div className="page-content max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <CatPawLogo size={30} />
          <div>
            <h1 className="text-base font-black text-foreground leading-tight">Кому помогли</h1>
            <p className="text-xs text-muted-foreground">Истории счастливых питомцев</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Heart size={48} className="mx-auto mb-3 opacity-25" />
            <p className="font-bold text-foreground mb-1">Пока историй нет</p>
            <p className="text-sm">Истории появятся, когда первый питомец найдёт дом</p>
          </div>
        ) : (
          <div className="space-y-5">
            {stories.map(story => (
              <div key={story.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Before / After photos */}
                <div className="before-after p-3 pb-0">
                  <div className="relative">
                    <img src={story.photoBefore} alt="До" className="rounded-xl w-full aspect-square object-cover" />
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-0.5 rounded-full">До</span>
                  </div>
                  <div className="relative">
                    <img src={story.photoAfter} alt="После" className="rounded-xl w-full aspect-square object-cover" />
                    <span className="absolute bottom-2 right-2 bg-primary/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">После</span>
                  </div>
                </div>

                <div className="p-3">
                  {/* Animal name + owner */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Heart size={14} className="text-primary fill-primary" />
                      <span className="font-extrabold text-sm text-foreground">
                        {story.animal?.name ?? "Питомец"}
                      </span>
                      <span className="text-xs text-muted-foreground">→ {story.newOwnerName}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays size={11} />
                      {new Date(story.rehomedDate).toLocaleDateString("ru-RU")}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{story.storyText}"
                  </p>
                  <p className="text-xs text-primary font-semibold mt-1.5">— Виолета</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
