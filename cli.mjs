#!/usr/bin/env node

import chalk from "chalk";
import fuzzy from "fuzzy";
import inquirer from "inquirer";
import inquirerAutocomplete from "inquirer-autocomplete-prompt";
import meow from "meow";
import open from "open";
import ora from "ora";
import escExit from "esc-exit";

import getRepos from "./getRepos.mjs";

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
        inquirerAutocomplete
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
