const readline = require("readline");
const { createComment, getDiff, approvePr } = require("../api");
const util = require("util");
const {
  buildPrList,
  buildComments,
  buildDiff,
  buildPrOverview,
} = require("../builders");
const {
  displayFileList,
  displayDiff,
  displayPrOverview,
} = require("../screens");
const { n, c, cl, clear, bar } = require("../helpers");
const requestOptions = require("../config");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = util.promisify(rl.question).bind(rl);

// PR List Prompt
const promptPrSelectionPage = async (allPrs) => {
  const prSelection = await prompt(
    `(0-${allPrs.values.length - 1}) select pr, (d0-${
      allPrs.values.length - 1
    }) view diff, (r) refresh: `
  );
  const input = prSelection.toLowerCase();
  if (input === "r") {
    cl("Updating Data...", "brightRed");
    buildPrList({ ...requestOptions, page: 1 }).then(promptPrSelectionPage);
  } else if (input.match(/(d\d+)/)) {
    cl("Loading...", "brightRed");
    cl(
      "This may take a while depending on the amount of changes...",
      "magenta"
    );
    const selectedPr = allPrs.values[input.match(/((d)(\d+))/)[3]].id;
    buildDiff({ ...requestOptions, pull_request_id: selectedPr }).then((x) =>
      promptDiffOptions(x, "prSelection")
    );
  } else if (input <= allPrs.values.length - 1) {
    cl("Loading PR...", "brightRed");
    return buildPrOverview({
      ...requestOptions,
      pull_request_id: allPrs.values[prSelection].id,
    }).then((pr) => {
      promptPrOverview(pr);
    });
  } else {
    cl("Invalid selection...", "brightRed");
    return buildPrList(requestOptions).then(promptPrSelectionPage);
  }
};

// Comments Prompt
const promptCommentsPage = async (commentData, pr) => {
  const prId = commentData.values[0].pullrequest.id;
  const isFirstPage = commentData?.page === 1 && "(h) previous,";
  const isLastPage =
    commentData?.size / commentData?.pagelen <= commentData?.page &&
    "(n) next,";
  const rawInput = await prompt(
    `(0-${
      commentData?.values?.length - 1
    }) reply \n(c) comment \n(n) next \n(h) previous \n(r) refresh \n(b) back to overview \n\n: `
  );

  const input = rawInput.toLowerCase();

  if (input === "r") {
    cl("Updating data...", "brightRed");
    return buildComments({
      ...requestOptions,
      pull_request_id: prId,
      page: commentData.page,
    }).then((commentData) => promptCommentsPage(commentData, pr));
  } else if (input === "c") {
    return promptTopLevelComment(pr);
  } else if (input === "n") {
    if (isLastPage) {
      cl("No more comments", "brightRed");
      return buildComments({ ...requestOptions, pull_request_id: prId }).then(
        (commentData) => promptCommentsPage(commentData, pr)
      );
    }
    cl("Loading...", "brightRed");
    buildComments({
      ...requestOptions,
      pull_request_id: prId,
      page: (requestOptions.page += 1),
    }).then((commentData) => promptCommentsPage(commentData, pr));
  } else if (input === "h") {
    if (isFirstPage) {
      cl("You are at the first page already...", "brightRed");
      return buildComments({ ...requestOptions, pull_request_id: prId }).then(
        (commentData) => promptCommentsPage(commentData, pr)
      );
    }
    cl("Loading...", "brightRed");
    buildComments({
      ...requestOptions,
      pull_request_id: prId,
      page: (requestOptions.page -= 1),
    }).then((commentData) => promptCommentsPage(commentData, pr));
  } else if (input.match(/(\d{1})/) && input <= commentData?.values?.length) {
    return promptRespondToComment(
      commentData?.values?.[input],
      commentData?.page,
      pr
    );
  } else if (input === "d") {
    cl("Loading...", "brightRed");
    cl(
      "This may take a while depending on the amount of changes...",
      "magenta"
    );
    return buildDiff({ ...requestOptions, pull_request_id: prId }).then(
      promptDiffOptions(pr)
    );
  } else if (input === "b") {
    return buildPrOverview({
      ...requestOptions,
      pull_request_id: prId,
      page: 1,
    }).then(promptPrOverview);
  } else {
    cl("Invalid selection", "brightRed");
    return buildComments({ ...requestOptions, pull_request_id: prId }).then(
      (commentData) => promptCommentsPage(commentData, pr)
    );
  }
};

// Diff Prompt
const promptDiffOptions = async (pr) => {
  bar("=");
  const input = await prompt(`(b) back: `);
  if (input.toLowerCase() === "b") {
    return buildPrList(requestOptions).then(promptPrSelectionPage);
  }
};

// Respond to Comments Prompt
const promptRespondToComment = async (commentData, page, pr) => {
  clear();
  c(n);
  c(commentData.content.raw);
  bar("=");

  const responseToSend = await prompt("(b) back\n\nResponse to send: ");
  if (responseToSend.toLowerCase() === "b") {
    return buildComments({
      ...requestOptions,
      pull_request_id: commentData.pullrequest.id,
      page,
    }).then((commentData) => promptCommentsPage(commentData, pr));
  } else {
    const confirmSend = await prompt(
      `\n\n${responseToSend}\n\nAre you sure you want to send? (y/n) `
    );
    if (confirmSend.toLowerCase() === "y") {
      const commentOptions = {
        _body: {
          parent: { id: commentData.id },
          content: { raw: responseToSend },
        },
        pull_request_id: commentData?.pullrequest?.id,
        repo_slug: requestOptions.repo_slug,
        workspace: requestOptions.workspace,
      };

      try {
        createComment(commentOptions);
        cl("Success!", "green");
        return buildComments({
          ...requestOptions,
          pull_request_id: commentData.pullrequest.id,
          page: 1,
        }).then((commentData) => promptCommentsPage(commentData, pr));
      } catch (err) {
        cl(`Error: ${err.error}`, "brightRed");
      }
    } else {
      return buildComments({
        ...requestOptions,
        pull_request_id: commentData.pullrequest.id,
        page,
      }).then((commentData) => promptCommentsPage(commentData, pr));
    }
  }
};

// Prompt to leave comment on PR
const promptTopLevelComment = async (pr) => {
  c(n);
  const comment = await prompt("Comment: ");
  const commentOptions = {
    _body: {
      content: { raw: comment },
    },
    pull_request_id: pr.prData.data.id,
  };

  bar("=");
  c(comment);
  bar("=");

  const confirmSend = await prompt("Are you sure you want to send (y/n)?: ");
  if (confirmSend.toLowerCase() === "y") {
    await createComment({ ...requestOptions, ...commentOptions }).then(
      async () => {
        cl("Success!", "brightGreen");
        const x = await buildComments({
          ...requestOptions,
          pull_request_id: pr.prData.data.id,
        });
        return promptCommentsPage(x);
      }
    );
  } else {
    return buildComments({
      ...requestOptions,
      pull_request_id: pr.prData.data.id,
    }).then((commentData) => promptCommentsPage(commentData, pr));
  }
};

// Prompt for PR Overview screen
const promptPrOverview = async (pr) => {
  bar("=");
  ds = pr.diffStat.data;
  const input = await prompt(
    `(c) comments, (f) files, (a) approve, (m) main menu: `
  );

  if (input.toLowerCase() === "f") {
    displayFileList(ds);
    return promptFileList(pr);
  } else if (input.toLowerCase() === "c") {
    cl("Loading comments...", "brightRed");

    await buildComments({
      ...requestOptions,
      page: 1,
      pull_request_id: pr.prData.data.id,
    }).then(async (commentData) => {
      if (commentData.values.length === 0) {
        cl("There are no comments on this PR yet...", "brightRed");
        c(n);

        const leaveComment = await prompt(
          "Would you like to leave one? (y/n): "
        );

        if (leaveComment.toLowerCase() === "y") {
          return promptTopLevelComment(pr);
        } else {
          return buildPrOverview({
            ...requestOptions,
            pull_request_id: pr.prData.data.id,
          }).then(promptPrOverview);
        }
      } else {
        return promptCommentsPage(commentData, pr);
      }
    });
  } else if (input.toLowerCase() === "m") {
    cl("Loading...", "brightRed");
    return buildPrList(requestOptions).then(promptPrSelectionPage);
  } else if (input.toLowerCase() === "a") {
    const confirmApprove = await prompt(
      `Are you sure you want to approve PR-${pr.prData.data.id}? (y/n): `
    );
    if (confirmApprove.toLowerCase() === "y") {
      c(n);
      await approvePr({
        ...requestOptions,
        pull_request_id: pr.prData.data.id,
      }).then((x) => {
        cl("Approved!", "green");
        return buildPrList(requestOptions).then(promptPrSelectionPage);
      });
    } else {
      return promptPrOverview(pr);
    }
  } else {
    c(n);
    cl("Invalid Selection...", "brightRed");
    return promptPrOverview(pr);
  }
};

// Prompt for File List screen
const promptFileList = async (pr) => {
  bar("=");
  const input = await prompt(
    `(0-${ds.values.length - 1}) view diff, (b) back: `
  );

  if (input.toLowerCase() === "b") {
    displayPrOverview(pr);
    return promptPrOverview(pr);
  } else if (input <= ds.values.length - 1) {
    const singleDiff = await getDiff({
      ...requestOptions,
      pull_request_id: pr.prData.data.id,
      path:
        pr.diffStat.data.values[input]?.new?.path ||
        pr.diffStat.data.values[input]?.old?.path,
    });
    displayDiff(singleDiff.data);
    return promptSingleDiff(pr);
  } else {
    cl("Invalid selection...", "brightRed");
    return promptFileList(pr);
  }
};

// Prompt for viewing diff of single file
const promptSingleDiff = async (pr) => {
  bar("=");
  const input = await prompt(`(b) back: `);
  if (input.toLowerCase() === "b") {
    clear();
    displayFileList(pr.diffStat.data);
    return promptFileList(pr);
  }
};

module.exports = { promptPrSelectionPage, promptCommentsPage };
