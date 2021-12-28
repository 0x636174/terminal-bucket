const formatDistance = require("date-fns/formatDistance");
const { n, c, cl, clear, maxWidth, bar, formatDateAgo } = require("../helpers");

// Pull Request Page
const displayPrList = (prs) => {
  clear();
  c(n);
  prs.values.map((pr, i) => {
    c(
      `${i}. ${pr.title} - PR ${pr.id} - (${pr.comment_count}) ${
        pr.activity.values
          .map((i) => i?.approval && "approval")
          .includes("approval")
          ? "🗸"
          : ""
      }`
    );
    cl(
      `   last updated ${formatDistance(
        new Date(pr.updated_on),
        new Date()
      )} ago`,
      "blue"
    );
    cl(".".repeat(maxWidth), "hidden");
  });
  bar("=");
};

// Comments Page
const displayComments = (allComments) => {
  if (allComments?.values?.length === 0) return null;

  const prData = allComments?.values[0].pullrequest;

  if (prData) {
    clear();
    cl(`${prData.title} - PR ${prData.id}`, "brightGreen");
    cl(`Page: ${allComments?.page}`, "green");
    c(n);
    allComments?.values.map((item, index) => {
      if (item.deleted === false) {
        cl(`(${index})`, "magenta");
        cl(
          `${item.user.display_name} (${formatDateAgo(item.created_on)}):`,
          "brightRed"
        );
        c(`${n} ${item.content.raw}`);
        item?.parent &&
          c(
            `${n}${item?.parent?.user?.display_name} (${formatDateAgo(
              item?.parent?.updated_on
            )}):`
          );
        item?.parent && c(`   ${item?.parent?.content?.raw}`);
        item.inline && c(`\n\n${item.inline.path} : ${item.inline.to} `);
        c(`${item.links.html.href}`);
        bar("=");
      } else {
        cl(`(${index})`, "magenta");
        cl(`Comment deleted (${item.user.display_name})`, "brightRed");
        bar("=");
      }
    });
  }
  return allComments;
};

// Diff Screen
const displayDiff = (data) => {
  clear();
  const lines = data.split(/\r?\n/);
  lines.map((line) => {
    if (line[0] === "-") {
      cl(line, "brightRed");
    } else if (line[0] === "+") {
      cl(line, "brightGreen");
    } else if (line[0] === "@") {
      cl(line, "blue");
    } else if (line.match(/(diff --git)/)) {
      cl(line, "magenta");
    } else {
      c(line);
    }
  });
};

const displayPrOverview = (prData) => {
  pr = prData.prData.data;
  ds = prData.diffStat.data;
  const descriptionLines = pr.description.split(/\r?\n/);
  clear();
  cl(`${pr.title} - PR ${pr.id} > ${pr.destination.branch.name}`, "green");
  cl(`Author: ${pr.author.display_name}`, "blue");
  cl(
    `Created: ${formatDateAgo(pr.created_on)} / Updated: ${formatDateAgo(
      pr.updated_on
    )}`,
    "blue"
  );
  cl(`Comments: ${pr.comment_count}`, "blue");
  cl(`Files: ${ds.size}`, "blue");

  c(n);
  descriptionLines.map((line) => c(line.replace("*", " -")));

  return { ds, pr };
};

const displayFileList = (data) => {
  clear();
  c(n);
  data.values.map((file, index) => {
    file.status === "modified" &&
      c(`${index}`.green + " " + ` ${file.status} `.black.bgGreen);
    file.status === "modified" && cl(` ${file.old.path} `, "green");

    file.status === "removed" &&
      c(`${index}`.brightRed + " " + ` ${file.status} `.black.bgBrightRed);
    file.status === "removed" && cl(file.old.path, "brightRed");

    file.status === "renamed" &&
      c(`${index}`.magenta + " " + ` ${file.status} `.black.bgMagenta);
    file.status === "renamed" && cl(file.old.path, "red");
    file.status === "renamed" && cl(file.new.path, "magenta");

    file.status === "added" &&
      c(`${index}`.brightGreen + " " + ` ${file.status} `.black.bgBrightGreen);
    file.status === "added" && cl(file.new.path, "brightGreen");
  });
};

module.exports = {
  displayPrList,
  displayComments,
  displayDiff,
  displayPrOverview,
  displayFileList,
};
