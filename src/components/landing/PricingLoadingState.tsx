// PricingLoadingState.tsx
export const PricingLoadingState = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-t border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-semibold mb-4">Loading Pricing Plans...</h2>
          <div className="animate-pulse flex flex-col items-center space-y-6">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-6 h-96">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
                  <div className="h-10 bg-muted rounded w-1/2 mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((_, j) => (
                      <div key={j} className="h-4 bg-muted rounded w-5/6"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};