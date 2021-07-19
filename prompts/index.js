const readline = require('readline');
const util = require('util');
const { buildPrList, buildComments, buildDiff } = require('../builders');
const { createComment } = require('../api');
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
    } else if (prSelection.toLowerCase().match(/(d\d+)/)) {
        cl('Loading...', 'brightRed')
        cl('This may take a while depending on the amount of changes...', 'magenta')
        const selectedPr = allPrs.values[prSelection.toLowerCase().match(/((d)(\d+))/)[3]].id
        buildDiff({ ...requestOptions, pull_request_id: selectedPr }).then(x => promptDiffOptions(x, 'prSelection'))
    } else if (allPrs.values[prSelection].comment_count === 0) {
        cl('No comments on this pr yet...', 'brightRed');
        return buildPrList(requestOptions).then(promptPrSelectionPage);
    }else if (prSelection <= allPrs.values.length - 1) {
        c('Loading PR...')
        try {
            return buildComments({ ...requestOptions, page: 1, pull_request_id: allPrs.values[prSelection]?.id }).then(promptCommentsPage)
        } catch (err) {
            c(err)
            return buildPrList(requestOptions)
        }

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
        `(0-${x?.values?.length - 1}) reply, (r) refresh, (n) next, (h) previous, (d) diff, (l) list pr's: `
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
    } else if (input.toLowerCase() === 'l') {
        c('Fetching PR list...')
        return buildPrList({ ...requestOptions, page: 1 }).then(promptPrSelectionPage)
    } else if (input.toLowerCase().match(/(\d{1})/) && input <= x?.values?.length) {
        return promptRespondToComment(x?.values?.[input], x?.page)
    } else if (input.toLowerCase() === 'd') {
        cl('Loading...', 'brightRed')
        cl('This may take a while depending on the amount of changes...', 'magenta')
        return buildDiff({ ...requestOptions, pull_request_id: prId }).then(x => promptDiffOptions(x, 'comments'))
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

module.exports = { promptPrSelectionPage, promptCommentsPage }