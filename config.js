const dotenv = require('dotenv');
const argv = require('minimist')(process.argv.splice(2));
dotenv.config()

let requestOptions = {
    pull_request_id: null || argv['pr'],
    repo_slug: process.env.REPO_SLUG,
    workspace: process.env.WORKSPACE,
    sort: '-created_on',
    pagelen: argv['len'] || 3,
    page: 1
}

module.exports = requestOptions