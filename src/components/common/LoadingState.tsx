import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingStateProps {
  type?: "stats" | "list" | "card" | "grid" | "form";
  count?: number;
}

export function LoadingState({ type = "card", count = 1 }: LoadingStateProps) {
  if (type === "stats") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-fade-in">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(count)].map((_, i) => (
          <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === "form") {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="space-y-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
