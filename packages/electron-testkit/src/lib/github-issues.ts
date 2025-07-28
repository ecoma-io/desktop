import axios from 'axios';

/**
 * E2E: Kiểm tra tính năng report unhandledRejection
 */
export async function findGithubIssueByTitle(
  title: string,
  owner: string,
  repo: string,
  token?: string
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`;
  const res = await axios.get(url, {
    headers: {
      ...(token ? { Authorization: `token ${token}` } : {}),
      Accept: 'application/vnd.github+json',
      'User-Agent': 'tikertok-app',
    },
  });
  const issues = res.data;
  return issues.find((issue: { title: string }) => issue.title.endsWith(title));
}
