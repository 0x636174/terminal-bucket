const { getAllPrs, getPrActivity, getPrData, getParentCommentData, getDiff } = require('./apiCalls');
const { displayPrList, displayComments, displayDiff } = require('./displays');
const { cl } = require('./help');

// PR List
const buildPrList = (options) => getAllPrs(options)
    .then(async (allPrs) => {
        const activity = await allPrs?.values?.map(async (item, index) => {
            return getPrActivity(options, allPrs?.values[index].id).then(activityData => {
                return item.activity = activityData
            })
        })

        await Promise.all(activity)
        displayPrList(allPrs)

        return allPrs
    })

// Comments
const buildComments = (options) => getPrData(options).then(async (allData) => {
    if (allData?.values?.length === 0) {
        cl('No Comments on this PR yet...', 'brightRed')
        return buildPrList(options)
    }

    const updatedParents = await allData?.values?.map(async (item, index) => {
        item.parent && await getParentCommentData(options, item?.parent?.id).then(parentData => item.parent = parentData)
    })
    await Promise.all(updatedParents)
    displayComments(allData)

    return allData
})

// Diff
const buildDiff = (options) => getDiff(options).then(
    x => {
        displayDiff(x)
        return x.prId
    })

module.exports = { buildPrList, buildComments, buildDiff }