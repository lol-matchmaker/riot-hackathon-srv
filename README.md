# League of Legends Matching Client

## Prerequisites

### Windows

On Windows, the following stack is recommended:

* [nvm-windows](https://github.com/coreybutler/nvm-windows) for installing node
* [Git for Windows](https://git-scm.com/download/win) sets up a Bash prompt
* [PostgreSQL for Windows](https://www.postgresql.org/download/windows/)

```bash
nvm install latest
```

[windows-build-tools](https://github.com/felixrieseberg/windows-build-tools)
will install the tools needed to build node packages. To install it, run the
following in a PowerShell with Administrative permissions.

```ps
npm config --global set msvs_version 2017
npm install --global --production windows-build-tools
```

### Mac

On Mac, use [Homebrew](https://brew.sh/) to install all the prerequisites:

```bash
brew install nvm postgresql
brew services start postgresql
nvm install latest
```

## Development

One-time database setup.

```bash
createdb riot_hackathon
```

Start the development server.

```bash
npm run dev
```
