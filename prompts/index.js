const readline = require('readline');
const util = require('util');
const { buildPrList, buildComments, buildDiff, buildPrOverview } = require('../builders');
const { createComment, getDiffStat, getDiff } = require('../api');
const { displayFileList, displayDiff, displayPrOverview } = require('../screens');
const { n, c, cl, clear, bar } = require('../helpers');
const requestOptions = require('../config');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = util.promisify(rl.question).bind(rl);

// PR List Prompt
const promptPrSelectionPage = async (allPrs) => {
    const prSelection = await question(`(0-${allPrs.values.length - 1}) select pr, (d0-${allPrs.values.length - 1}) view diff, (r) refresh: `)
    if (prSelection.toLowerCase() === 'r') {
        c('Updating Data...')
        buildPrList({ ...requestOptions, page: 1 }).then(promptPrSelectionPage)
    }
    else if (prSelection.toLowerCase().match(/(d\d+)/)) {
        cl('Loading...', 'brightRed')
        cl('This may take a while depending on the amount of changes...', 'magenta')
        const selectedPr = allPrs.values[prSelection.toLowerCase().match(/((d)(\d+))/)[3]].id
        buildDiff({ ...requestOptions, pull_request_id: selectedPr }).then(x => promptDiffOptions(x, 'prSelection'))
    }
    // else if (allPrs.values[prSelection].comment_count === 0) {
    //     cl('No comments on this pr yet...', 'brightRed');
    //     return buildPrList(requestOptions).then(promptPrSelectionPage);
    // }
    else if (prSelection <= allPrs.values.length - 1) {
        c('Loading PR...')
        return buildPrOverview({ ...requestOptions, pull_request_id: allPrs.values[prSelection].id }).then(pr => { promptPrOverview(pr) })
        // try {
        //     return buildComments({ ...requestOptions, page: 1, pull_request_id: allPrs.values[prSelection]?.id }).then(promptCommentsPage)
        // } catch (err) {
        //     c(err)
        //     return buildPrList(requestOptions)
        // }

    } else {
        cl('Invalid selection...', 'brightRed')
        return buildPrList(requestOptions).then(promptPrSelectionPage)
    }
}

// Comments Prompt
const promptCommentsPage = async (x) => {
    const prId = x.values[0].pullrequest.id
    const isFirstPage = x?.page === 1 && '(h) previous,';
    const isLastPage = x?.size / x?.pagelen <= x?.page && '(n) next,'
    c(n)
    const input = await question(
        `(0-${x?.values?.length - 1}) reply, (r) refresh, (n) next, (h) previous, (d) diff, (b) back: `
    );

    if (input.toLowerCase() === 'r') {
        c('Updating data...')
        return buildComments({ ...requestOptions, pull_request_id: prId }).then(promptCommentsPage)
    } else if (input.toLowerCase() === 'q') {
        c('Exiting...')
        rl.close()
        process.exit()
    } else if (input.toLowerCase() === 'n') {
        if (isLastPage) {
            cl('No more comments', 'brightRed')
            return buildComments({ ...requestOptions, pull_request_id: prId }).then(promptCommentsPage)
        }
        c('Loading...')
        buildComments({ ...requestOptions, pull_request_id: prId, page: requestOptions.page += 1 }).then(promptCommentsPage)
    } else if (input.toLowerCase() === 'h') {
        if (isFirstPage) {
            cl('You are at the first page already...', 'brightRed')
            return buildComments({ ...requestOptions, pull_request_id: prId }).then(promptCommentsPage)
        }
        c('Loading...')
        buildComments({ ...requestOptions, pull_request_id: prId, page: requestOptions.page -= 1 }).then(promptCommentsPage)
    } 
    // else if (input.toLowerCase() === 'l') {
    //     c('Fetching PR list...')
    //     return buildPrList({ ...requestOptions, page: 1 }).then(promptPrSelectionPage)
    // } 
    else if (input.toLowerCase().match(/(\d{1})/) && input <= x?.values?.length) {
        return promptRespondToComment(x?.values?.[input], x?.page)
    } else if (input.toLowerCase() === 'd') {
        cl('Loading...', 'brightRed')
        cl('This may take a while depending on the amount of changes...', 'magenta')
        return buildDiff({ ...requestOptions, pull_request_id: prId }).then(x => promptDiffOptions(x, 'comments'))
    }
    else if (input.toLowerCase() === 'b') {
        return buildPrOverview({ ...requestOptions, pull_request_id: prId }).then(promptPrOverview)
    }
    else {
        cl('Invalid selection', 'brightRed')
        return buildComments({ ...requestOptions, pull_request_id: prId }).then(promptCommentsPage)
    }
}

// Diff Prompt
const promptDiffOptions = async (prId, page) => {
    bar('=')
    const input = await question(`(b) back: `);
    if (input.toLowerCase() === 'b') {
        if (page === 'prSelection') {
            return buildPrList(requestOptions).then(promptPrSelectionPage)
        }

        if (page === 'comments') {
            return buildComments({ ...requestOptions, pull_request_id: prId }).then(promptCommentsPage)
        }
    }
}

// Respond to Comments Prompt
const promptRespondToComment = async (commentData, page) => {
    clear()
    c(n)
    c(commentData.content.raw)
    bar('=')

    const responseToSend = await question('(b) back\n\nResponse to send: ');
    if (responseToSend.toLowerCase() === 'b') {
        return buildComments({ ...requestOptions, pull_request_id: commentData.pullrequest.id, page }).then(promptCommentsPage)
    } else {
        const confirmSend = await question(`\n\n${responseToSend}\n\nAre you sure you want to send? (y/n) `)
        if (confirmSend.toLowerCase() === 'y') {
            const commentOptions = {
                _body: {
                    parent: { id: commentData.id },
                    content: { raw: responseToSend }
                },
                pull_request_id: commentData?.pullrequest?.id,
                repo_slug: requestOptions.repo_slug,
                workspace: requestOptions.workspace
            }

            try {
                createComment(commentOptions)
                cl('Success!', 'green')
                return buildComments({ ...requestOptions, pull_request_id: commentData.pullrequest.id, page: 1 }).then(promptCommentsPage)
            } catch (err) {
                c('Error:', err.error)
            }
        } else {
            return buildComments({ ...requestOptions, pull_request_id: commentData.pullrequest.id, page }).then(promptCommentsPage)
        }
    }
}

const promptPrOverview = async (pr) => {
    // c(pr)
    bar('=')
    ds = pr.diffStat.data
    // const prId = pr.
    // c(pr)

    const input = await question(`(c) comments, (f) files, (l) list pr's: `);
    if (input.toLowerCase() === 'f') {
        displayFileList(ds)
        return promptFileList(pr)
    } else if (input.toLowerCase() === 'c') {
        // c(pr)
        return buildComments({ ...requestOptions, page: 1, pull_request_id: pr.prData.data.id }).then(promptCommentsPage)
    } else if (input.toLowerCase() === 'b') {
        cl('Loading...', 'brightRed')
        return buildPrList(requestOptions).then(promptPrSelectionPage)
    } else {
        c(n)
        cl('Invalid Selection...', 'brightRed')
        return promptPrOverview(pr)
    }
}

const promptFileList = async (pr) => {
    bar('=');
    const input = await question(`(0-${ds.values.length}) view diff, (b) back: `)

    if (input.toLowerCase() === 'l') {
        displayPrOverview(pr)
        return promptPrOverview(pr)
    }
    else if (input <= ds.values.length - 1) {
        // c(ds.values[input])
        // const singleDiff = await getDiff({ ...requestOptions, pull_request_id: pr.prData.data.id, path: pr.diffStat.data.values[input]?.new?.path || pr.diffStat.data.values[input]?.old?.path })
        const singleDiff = await getDiff({ ...requestOptions, pull_request_id: pr.prData.data.id, path: pr.diffStat.data.values[input]?.new?.path || pr.diffStat.data.values[input]?.old?.path })
        // c(singleDiff)
        displayDiff(singleDiff.data)
        return promptSingleDiff(pr)
    }
}

const promptSingleDiff = async (pr) => {
    bar('=');
    const input = await question(`(b) back: `);
    if (input.toLowerCase() === 'b') {
        clear();
        displayFileList(pr.diffStat.data)
        return promptFileList(pr)
    }
}

module.exports = { promptPrSelectionPage, promptCommentsPage }