const fs = require('fs')
const YAML = require('yaml')
const core = require('@actions/core')
const _ = require('lodash')

const cliConfigPath = `${process.env.HOME}/.jira.d/config.yml`
const configPath = `${process.env.HOME}/jira/config.yml`
const Action = require('./action')

// eslint-disable-next-line import/no-dynamic-require
const githubEvent = require(process.env.GITHUB_EVENT_PATH)
const config = YAML.parse(fs.readFileSync(configPath, 'utf8'))

async function exec () {
  try {
    const results = await new Action({
      githubEvent,
      argv: parseArgs(),
      config,
    }).execute()

    if (results && !_.isEmpty(results)) {
      console.log(`Detected issues: ${results.map(i => i.issue).join(',')}`)
      console.log(`Saving issues to ${cliConfigPath}`)
      console.log(`Saving issues to ${configPath}`)

      // Expose created issue's key as an output
      core.setOutput('issues', results)

      const yamledResult = YAML.stringify(results)
      const extendedConfig = Object.assign({}, config, results)

      fs.writeFileSync(configPath, YAML.stringify(extendedConfig))

      return fs.appendFileSync(cliConfigPath, yamledResult)
    }

    console.log('No issue keys found.')
  } catch (error) {
    core.setFailed(error.toString())
  }
}

function parseArgs () {
  return {
    string: core.getInput('string') || config.string,
    from: core.getInput('from'),
  }
}

exec()
