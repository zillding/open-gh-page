import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

async function getNumberOfRepos(username) {
  const response = await octokit.users.getByUsername({ username });
  return response.data.public_repos;
}

async function getReposForUser(username, number) {
  const per_page = 100;
  const pages = Math.ceil(number / per_page);

  const values = await Promise.all(
    [...Array(pages).keys()].map(async index => {
      const response = await octokit.repos.listForUser({
        username,
        page: index + 1,
        per_page
      });
      return response.data;
    })
  );

  return values.reduce((a, current) => a.concat(current), []);
}

export default async function(username) {
  const numberOfRepos = await getNumberOfRepos(username);
  const repos = await getReposForUser(username, numberOfRepos);
  return repos;
};
