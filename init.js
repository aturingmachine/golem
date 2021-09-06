/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync, exec } = require('child_process')
const readline = require('readline')
const { readFileSync, writeFileSync, rmSync } = require('fs')
const path = require('path')
let chalk = {
  yellow: (...args) => args,
  green: (...args) => args,
  magenta: (...args) => args,
  cyan: (...args) => args,
}

function log(msg, shouldPersist) {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`>>> ${msg} ${shouldPersist ? '\n' : ''}`)
}

let projectName
let projectDescription

const dependecies = [
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  'eslint-config-prettier',
  'eslint-plugin-import',
  'eslint-plugin-prettier',
  'eslint',
  'jest',
  'prettier',
  'ts-jest',
  'typescript',
]

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const filesNames = {
  nvm: '.nvmrc',
  ts: 'tsconfig.json',
  pkg: 'package.json',
}

const placeHolders = {
  pkg: {
    name: 'PKG.NAME',
    desc: 'PKG.DESCRIPTION',
    main: 'PKG.MAIN',
    prepub: 'PKG.PREPUB',
  },
  ts: {
    target: 'TS.TARGET',
    lib: 'TS.LIB',
  },
  nvm: 'NVM.VER',
}

const options = {
  module: {
    pkg: {
      main: '"main": "dist/index.js",',
      prepub: '"prepublishOnly": "npm run build",',
    },
    nvm: 'v12.13.0',
    ts: {
      target: 'esnext',
      lib: 'ES2015',
    },
  },
  project: {
    pkg: {
      main: '',
      prepub: '',
    },
    nvm: 'v16.3.0',
    ts: {
      target: 'esnext',
      lib: 'esnext',
    },
  },
}

function setupFile(fileName, confReplacers, logName) {
  log(chalk.yellow(`Reading template for ${logName}`))
  const templateFilePath = path.resolve(__dirname, `${fileName}.template`)
  const filePath = path.resolve(__dirname, fileName)
  let contents = readFileSync(templateFilePath, { encoding: 'utf-8' })

  log(chalk.yellow(`Updating template for ${logName}`))
  confReplacers.forEach(([find, replace]) => {
    contents = contents.replace(find, replace)
  })

  log(chalk.yellow(`Writing Configuration for ${logName}`))
  writeFileSync(filePath, contents, { encoding: 'utf-8' })

  log(chalk.magenta(`Removing template for ${logName}`))
  rmSync(templateFilePath)
  log(chalk.green(`Templating complete for ${logName}\n`), true)
}

function getProjectInfo() {
  rl.question('\n>>> Project Name: ', (ans) => {
    projectName = ans.length
      ? ans.replace(/\s/g, '-').toLowerCase()
      : 'typescript-project'
    rl.question('\n>>> Project Description: ', (ans) => {
      projectDescription = ans
      getProjectType()
    })
  })
}

function getProjectType() {
  rl.question(
    '\n>>> Are we making a [M]odule or a [P]roject? (default: project) ',
    (ans) => {
      const answer = ans.charAt(0).toLowerCase() === 'm' ? 'module' : 'project'
      console.log('\n')

      initProject(answer)
    }
  )
}

function initProject(projectType) {
  rl.close()
  log(chalk.yellow(`Templating ${projectType} ${projectName}\n`), true)
  const target = options[projectType]
  const pkgConf = [
    [placeHolders.pkg.name, projectName],
    [placeHolders.pkg.desc, projectDescription],
    [placeHolders.pkg.main, target.pkg.main],
    [placeHolders.pkg.prepub, target.pkg.prepub],
  ]
  const tsConf = [
    [placeHolders.ts.target, target.ts.target],
    [placeHolders.ts.lib, target.ts.lib],
  ]
  const nvmConf = [[placeHolders.nvm, target.nvm]]

  setupFile(filesNames.pkg, pkgConf, 'Package Information')
  setupFile(filesNames.ts, tsConf, 'Typescript Configuration')
  setupFile(filesNames.nvm, nvmConf, 'NVM Configuration')

  finalizeSetup()
}

function installDeps() {
  log(chalk.yellow('Installing Dependencies...'), true)
  execSync(`npm i -D --no-fund --no-audit ${dependecies.join(' ')}`, {
    stdio: 'inherit',
  })
  log(chalk.green('Dependencies installed.'), true)
}

function finalizeSetup() {
  installDeps()

  log(chalk.yellow('Initializing Git...'))
  rmSync(path.resolve(__dirname, '.git'), { recursive: true })
  console.log('\n')
  execSync('git init -b main', { stdio: 'inherit' })
  log(chalk.yellow('Running initial commit...'))
  execSync('git add . && git commit -m "Initial Commit"', { stdio: 'inherit' })
  log(chalk.green('Git Initialized.\n'), true)

  log(chalk.cyan('Set to track your repo:'), true)
  log(chalk.cyan('git remote add origin <your-repo-link>'), true)

  console.log('\n')
  log(chalk.magenta('Removing init script...'), true)
  rmSync('init.js')
  log(chalk.green('Project ready!'))
}

function main() {
  const args = process.argv.slice(2).map((arg) => arg.toLowerCase())

  if (args.includes('p', 'pretty')) {
    log('Preparing to generate template...', true)
    execSync('npm i --no-package-lock --no-audit chalk')
    chalk = require('chalk')
    execSync('rm -rf node_modules')
    log(chalk.cyan('Generating Template.'), true)
  }

  getProjectInfo()
}

main()
