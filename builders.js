const { getAllPrs, getPrActivity, getPrData, getParentCommentData, getDiff } = require('./api');
const { displayPrList, displayComments, displayDiff } = require('./screens');
// const { cl } = require('./helpers');

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