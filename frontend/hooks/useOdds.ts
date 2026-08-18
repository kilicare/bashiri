import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOdds, getMatchOdds, getBookmakers } from "@/lib/api/predictions";

export function useOdds(league?: string, status?: string, lang?: string) {
  return useQuery({
    queryKey: ["odds", league, status, lang],
    queryFn: () => getOdds(league, status, lang),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}

export function useMatchOdds(matchId: number, lang?: string) {
  return useQuery({
    queryKey: ["matchOdds", matchId, lang],
    queryFn: () => getMatchOdds(matchId, lang),
    refetchInterval: 30000,
    staleTime: 25000,
    enabled: !!matchId,
  });
}

export function useBookmakers() {
  return useQuery({
    queryKey: ["bookmakers"],
    queryFn: getBookmakers,
    refetchInterval: 3600000, // Refresh every hour
    staleTime: 3500000,
  });
}

export function useOddsRefetch() {
  const queryClient = useQueryClient();
  
  return {
    refetchOdds: () => queryClient.invalidateQueries({ queryKey: ["odds"] }),
    refetchMatchOdds: (matchId: number) => queryClient.invalidateQueries({ queryKey: ["matchOdds", matchId] }),
    refetchBookmakers: () => queryClient.invalidateQueries({ queryKey: ["bookmakers"] }),
  };
}