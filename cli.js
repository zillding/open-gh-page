#!/usr/bin/env node

const chalk = require("chalk");
const fuzzy = require("fuzzy");
const inquirer = require("inquirer");
const meow = require("meow");
const open = require("open");
const ora = require("ora");
const updateNotifier = require("update-notifier");
const escExit = require("esc-exit");

const pkg = require("./package.json");
const getRepos = require("./getRepos");

updateNotifier({ pkg }).notify();

const cli = meow(`
  Usage
    $ open-gh-page <gh username>

  Examples
    $ open-gh-page zillding
`);

function getHomepage(repo) {
  if (repo.name === `${repo.owner.login}.github.io`) {
    return `https://${repo.name}/`;
  }
  return repo.homepage || `https://${repo.owner.login}.github.io/${repo.name}`;
}

function filterRepos(input, repos) {
  return repos.filter(o => fuzzy.test(input || "", o.short));
}

function handleUsername(username) {
  const spinner = ora(
    `Fetching repos of ${chalk.green.underline(username)} ...`
  ).start();

  getRepos(username)
    .then(repos =>
      repos.filter(o => o.has_pages).map(o => ({
        name: `${o.name} ${chalk.dim(getHomepage(o))}`,
        value: getHomepage(o),
        short: o.name
      }))
    )
    .then(result => {
      spinner.stop();
      if (result.length === 0) {
        console.warn(chalk.yellow("No public github pages available."));
        return;
      }
      inquirer.registerPrompt(
        "autocomplete",
        require("inquirer-autocomplete-prompt")
      );
      const question = {
        type: "autocomplete",
        name: "url",
        message: "Select a github page:",
        source: (_, input) => Promise.resolve(filterRepos(input, result))
      };
      inquirer.prompt([question]).then(answer => {
        open(answer.url);
      });
    })
    .catch(err => {
      spinner.stop();
      console.error(chalk.red("Failed to fetch repos."));
      throw err;
    });
}

function handleInit() {
  const question = {
    name: "username",
    message: "Provide a github username:"
  };
  inquirer.prompt([question]).then(answer => {
    if (answer.username) return handleUsername(answer.username);
    console.error(chalk.red("Please provide a valid github username."));
  });
}

function init(username) {
  escExit();
  if (username) return handleUsername(username);
  return handleInit();
}

init(cli.input[0]);
