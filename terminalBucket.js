const { splash } = require('./splash');
const { buildPrList, buildComments } = require('./builders');
const { promptPrSelectionPage, promptCommentsPage } = require('./prompts');
const { cl, clear, rand, colorList } = require('./help');
const requestOptions = require('./config');

if (requestOptions.pull_request_id) {
    buildComments(requestOptions).then(promptCommentsPage)
} else {
    clear()
    cl(splash[rand(0, splash.length)], colorList[rand(0, colorList.length)])
    setTimeout(() => {
        buildPrList(requestOptions).then(promptPrSelectionPage)
    }, 666)
}