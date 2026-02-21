import { useQuery } from "@tanstack/react-query";

const GITHUB_REPO = "rmr-studio/riven";

async function fetchGitHubStars(): Promise<number> {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
  if (!res.ok) throw new Error("Failed to fetch GitHub stars");
  const data = await res.json();
  return data.stargazers_count;
}

export function useGitHubStars() {
  return useQuery({
    queryKey: ["github-stars", GITHUB_REPO],
    queryFn: fetchGitHubStars,
    staleTime: 5 * 60 * 1000,
  });
}
