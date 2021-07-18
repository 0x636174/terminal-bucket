# Terminal Bucket
## Because BitBucket is annoying and we all know it 💀

### Clone:
`git clone https://github.com/0x636174/terminal-bucket.git`

### Install:
`cd terminal-bucket && npm install`

### Setup:
Create an `.env` with the following:
```
BASE_URL=https://api.bitbucket.org/2.0
REPO_SLUG=<your_repo>
WORKSPACE=<your_workspace>
USERNAME=<bitbucket_username>
PASSWORD=<bitbucket_password>
```

### Run:
`node terminalBucket.js`

#### Flags:
**pr**: skip PR menu and view PR specific comments
```
node terminalBucket.js --pr <Number>
```

**len**: number of comments to show per page
```
node terminalBucket.js --len <Number>
```

