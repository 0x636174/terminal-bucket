const dotenv = require('dotenv');
const { Bitbucket } = require('bitbucket');
dotenv.config()

const clientOptions = {
    baseUrl: 'https://api.bitbucket.org/2.0',
    auth: {
        username: process.env.USERNAME,
        password: process.env.PASSWORD
    },
    request: {
        timeout: 10000
    }
}

const bitbucket = new Bitbucket(clientOptions);

const getAllPrs = async (requestOptions) => {
    const { data } = await bitbucket.pullrequests.list({ repo_slug: requestOptions.repo_slug, workspace: requestOptions.workspace, state: 'OPEN' })
    return data
}

const getPrData = async (requestOptions) => {
    const { data } = await bitbucket.pullrequests.listComments(requestOptions)
    return data
}

const getParentCommentData = async (requestOptions, comment_id) => {
    const { data } = await bitbucket.pullrequests.getComment({ ...requestOptions, comment_id })
    return data
}

const createComment = async (commentOptions) => {
    const { data, headers } = await bitbucket.pullrequests.createComment({ ...commentOptions })
    return {data, headers}
}

const getPrActivity = async (requestOptions, prId) => {
    const { data } = await bitbucket.pullrequests.listActivities({ ...requestOptions, pull_request_id: prId, pagelen: undefined })
    return data
}

const getDiff = async (requestOptions) => {
    const { data } = await bitbucket.pullrequests.getDiff({ ...requestOptions })
    return { data, prId: requestOptions.pull_request_id }
}

const getPr = async (requestOptions) => {
    const { data } = await bitbucket.pullrequests.get({ ...requestOptions })
    return { data }
}

const getDiffStat = async (requestOptions) => {
    const { data } = await bitbucket.pullrequests.getDiffStat({ ...requestOptions })
    return { data }
}

const approvePr = async (requestOptions) => {
    const { data } = await bitbucket.pullrequests.createApproval({ ...requestOptions })
    return data
}


module.exports = { getAllPrs, getPrData, getParentCommentData, createComment, getPrActivity, getDiff, getPr, getDiffStat, approvePr }