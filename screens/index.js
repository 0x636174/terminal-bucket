const formatDistance = require('date-fns/formatDistance');
const { n, c, cl, clear, maxWidth, bar } = require('../helpers');

// Pull Request Page
const displayPrList = (prs) => {
    clear()
    c(n)
    prs.values.map((pr, i) => {
        c(`${i}. ${pr.title} - PR ${pr.id} - (${pr.comment_count}) ${pr.activity.values.map(i => i?.approval && 'approval').includes('approval') ? '🗸' : ''}`)
        cl(`   last updated ${formatDistance(new Date(pr.updated_on), new Date())} ago`, 'blue')
        cl('.'.repeat(maxWidth), 'hidden')
    })
    bar('=')
}

// Comments Page
const displayComments = (allComments) => {
    if (allComments?.values?.length === 0) return null

    const prData = allComments?.values[0].pullrequest
    const formatDate = (date) => formatDistance(new Date(date), new Date())

    if (prData) {
        clear()
        cl(`${prData.title} - PR ${prData.id}`, 'brightGreen')
        cl(`Page: ${allComments?.page}`, 'green')
        c(n)
        allComments?.values.map((item, index) => {
            if (item.deleted === false) {
                cl(`(${index})`, 'magenta')
                cl(`${item.user.display_name} (${formatDate(item.created_on)} ago):`, 'brightRed')
                c(`${n} ${item.content.raw}`)
                item?.parent && c(`${n}${item?.parent?.user?.display_name} (${formatDate(item?.parent?.updated_on)} ago):`)
                item?.parent && c(`   ${item?.parent?.content?.raw}`)
                item.inline && c(`${n}${item.inline.path} : ${item.inline.to} `)
                c(`${item.links.html.href}`)
                bar('=')
            } else {
                cl(`(${index})`, 'magenta')
                cl(`Comment deleted (${item.user.display_name})`, 'brightRed')
                bar('=')
            }
        })
    }
    return allComments
}

// Diff Screen
const displayDiff = (data) => {
    clear()
    const lines = data.data.split(/\r?\n/)
    lines.map(line => {
        if (line[0] === '-') {
            cl(line, 'brightRed')
        } else if (line[0] === '+') {
            cl(line, 'brightGreen')
        } else if (line[0] === '@') {
            cl(line, 'blue')
        } else if (line.match(/(diff --git)/)) {
            cl(line, 'magenta')
        }
        else {
            c(line)
        }
    })
}

module.exports = { displayPrList, displayComments, displayDiff }