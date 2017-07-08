const filledArray = require("filled-array");
const GitHubApi = require("github");

const github = new GitHubApi({ Promise });

function getNumberOfRepos(username) {
  return github.users
    .getForUser({ username })
    .then(res => res.data.public_repos);
}

function getReposForUser(username, number) {
  const per_page = 30;
  const pages = Math.ceil(number / per_page);

  const promises = filledArray(1, 3).map((_, index) =>
    github.repos
      .getForUser({ username, page: index + 1, per_page })
      .then(res => res.data)
  );

  return Promise.all(promises).then(values =>
    values.reduce((a, current) => a.concat(current), [])
  );
}

module.exports = function getRepos(username) {
  return getNumberOfRepos(username).then(number =>
    getReposForUser(username, number)
  );
};
