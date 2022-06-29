import "./style.css";
import * as wn from "webnative";
import FileSystem from "webnative/fs/index";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import extract from "remark-extract-frontmatter";
import { parse } from "yaml";
import ConnectedIcon from "../plugin-connected.svg";
import DisconnectedSvg from "../plugin-disconnected.svg";
import { BaseLink } from "webnative/fs/types";

const permissions = {
  app: {
    name: "mumblr",
    creator: "Jess Martin",
  },
  fs: {
    private: [wn.path.directory("Posts")], // This will be `private/Posts`
    public: [wn.path.directory("Posts"), wn.path.directory("Apps", "mumblr")], // This will be `public/Posts`
  },
};

const state = await wn
  .initialise({
    permissions: permissions,
  })
  .catch((err) => {
    switch (err) {
      case wn.InitialisationError.InsecureContext:
      // TODO: Notify the user that the app is not secure
      case wn.InitialisationError.UnsupportedBrowser:
      // TODO: Notify the user of the error
    }
  });

// Give me maximum debuggage
// TODO: Disable when in production
wn.setup.debug({ enabled: true });

let fs: FileSystem | undefined;
const connectionStatus = document.querySelector<HTMLInputElement>(
  "#connect-disconnect"
)!;

switch (state?.scenario) {
  case wn.Scenario.AuthCancelled:
    console.log("Auth cancelled by user");
    break;

  case wn.Scenario.AuthSucceeded:
  // New permissions have been granted
  case wn.Scenario.Continuation:
    // Great success! We can now use the filesystem!
    console.log("Connected");
    connectionStatus.innerHTML = `<img src="${ConnectedIcon}" id="connect-disconnect-icon" >`;
    fs = state.fs; // Load the filesystem
    connectionStatus.addEventListener("click", async function () {
      wn.leave().then(() => {
        console.log("Disconnected");
      });
    });
    // Enable the UI
    document.querySelector<HTMLButtonElement>("#post")!.disabled = false;
    document.querySelector<HTMLTextAreaElement>("#body-input")!.disabled =
      false;
    break;

  case wn.Scenario.NotAuthorised:
    connectionStatus.innerHTML = `<img src="${DisconnectedSvg}" id="connect-disconnect-icon" >`;
    connectionStatus.addEventListener("click", async function () {
      console.log("Redirected to lobby");
      wn.redirectToLobby(permissions);
    });
    console.log("Not connected");
    break;
}

const publishBtn = document.querySelector<HTMLInputElement>("#post")!;

publishBtn.addEventListener("click", async function () {
  const body = document.querySelector<HTMLTextAreaElement>(".body-input")!;

  // If body is blank, don't publish
  if (body.value.trim().length === 0) {
    return;
  }

  publishBtn.disabled = true;
  publishBtn.value = "Publishing...";

  const postTimestamp = Date.now();
  const frontmatter = `---
postedAt: ${postTimestamp}
---\n`;
  const postContent = frontmatter + body.value;

  if (fs !== undefined) {
    const filePath = wn.path.file("public", "Posts", `${postTimestamp}.md`);
    await fs.add(filePath, postContent).then(() => {
      console.log("file saved");
    });
    await fs
      .publish()
      .then(() => {
        console.log("file system published");
        publishBtn.value = "Publish successful!";
        enablePublishBtn();
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("no file system");
  }
});

async function enablePublishBtn() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  publishBtn.value = "Publish";
  publishBtn.disabled = false;
}

const buildSiteButton =
  document.querySelector<HTMLInputElement>("#build-button")!;

buildSiteButton.addEventListener("click", async function () {
  console.log("attempting to build site");
  buildSiteButton.disabled = true;
  buildSiteButton.value = "Building...";

  // Read the most recent Markdown files
  let markdownPosts = [];
  // TODO: Make this into a "break" statement
  if (fs !== undefined) {
    const linksObject = await fs.ls(wn.path.directory("public", "Posts"));
    const links = Object.entries(linksObject);

    // If file is a directory, skip it
    const files = await Promise.all(
      links.filter((link) => (link[1] as BaseLink).isFile)
    );

    const posts = await Promise.all(
      files.map(([name, _]) => {
        const filePath = wn.path.file("public", "Posts", name);
        return fs?.cat(filePath);
      })
    );

    // Convert the FileContentRaw, which is a uint8array to string
    const filesContents = [];
    const decoder = new TextDecoder();
    for (const post of posts) {
      filesContents.push(decoder.decode(post as Uint8Array));
    }

    // Convert the string to micromark
    const parsedPosts = await Promise.all(
      filesContents.map((content) => {
        return unified()
          .use(remarkParse)
          .use(remarkFrontmatter)
          .use(extract, { yaml: parse })
          .use(remarkRehype)
          .use(rehypeStringify)
          .process(content);
      })
    );

    // Ignore files that don't have postedAt
    markdownPosts = parsedPosts.filter((post) => {
      return post.data.postedAt !== undefined;
    });

    // Sort the files by postedAt
    markdownPosts.sort((a, b) => {
      return (
        new Date(b.data.postedAt as number).getTime() -
        new Date(a.data.postedAt as number).getTime()
      );
    });
    console.log(markdownPosts);
    // Build the HTML/CSS
    const parser = new DOMParser();
    const serializer = new XMLSerializer();

    // Load the template HTML file locally
    const indexTemplate = await fetch("/indexTemplate.html");
    const indexTemplateString = await indexTemplate.text();
    const indexTemplateDoc = parser.parseFromString(
      indexTemplateString,
      "text/html"
    );

    const postTemplate = await fetch("/postTemplate.html");
    const postTemplateString = await postTemplate.text();

    // Generate the HTML for each markdown post and insert into template html
    const blogPostsDiv = document.createElement("div");
    // iterate over the posts
    for await (const markdownPost of markdownPosts) {
      const postTimestamp = markdownPost.data.postedAt as number;
      const postDate = new Date(markdownPost.data.postedAt as number);
      const postDateString = postDate.toLocaleString("en-us", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      // build up blogPostHtml
      const postDiv = document.createElement("div");
      postDiv.innerHTML = `
      <div class="update">
        <div class="update-t" data-timestamp="#">
          <a class="datestamp" href="updates/${postTimestamp}" title="Permalink to this update">${postDateString}</a>
          <a class="clockstamp" href="updates/${postTimestamp}" title="Permalink to this update">${
        postDate.getHours() + ":" + postDate.getMinutes()
      }</a>
        </div>
        <div class="update-s">
          ${markdownPost.value}
        </div>
      </div>
      `;

      // Create a page for this post
      const postDoc = parser.parseFromString(postTemplateString, "text/html");
      const innerPostDiv = postDoc.querySelector("div.feed");
      innerPostDiv?.appendChild(postDiv);

      // Write this page to IPFS
      const updatesHtmlPath = wn.path.file(
        "public",
        "Apps",
        "mumblr",
        "updates",
        `${postTimestamp}`,
        "index.html"
      );
      const postDocString = serializer.serializeToString(postDoc);
      await fs.add(updatesHtmlPath, postDocString).then(() => {
        console.log("blog post added");
      });

      // Add the post to the HTML of all posts
      blogPostsDiv.appendChild(postDiv);
    }
    const feedDiv = indexTemplateDoc.querySelector("div.feed");
    feedDiv?.appendChild(blogPostsDiv);

    // Write the static site to IPFS
    // Write the template HTML to index.html
    const indexHtmlPath = wn.path.file(
      "public",
      "Apps",
      "mumblr",
      "index.html"
    );
    const templateDocString = serializer.serializeToString(indexTemplateDoc);

    await fs.add(indexHtmlPath, templateDocString).then(() => {
      console.log("index page added");
    });

    // Write the stylesheet to IPFS
    const stylesheet = await fetch("/templateStyle.css.txt");
    const stylesheetString = await stylesheet.text();

    const stylesheetPath = wn.path.file(
      "public",
      "Apps",
      "mumblr",
      "style.css"
    );
    await fs.add(stylesheetPath, stylesheetString).then(() => {
      console.log("stylesheet added");
    });

    // Write the about page to IPFS
    const aboutPage = await fetch("/about.html");
    const aboutPageString = await aboutPage.text();

    const aboutPagePath = wn.path.file(
      "public",
      "Apps",
      "mumblr",
      "about",
      "index.html"
    );
    await fs.add(aboutPagePath, aboutPageString).then(() => {
      console.log("about page added");
    });

    // Publish the static html to IPFS
    await fs
      .publish()
      .then(() => {
        console.log("file system published");
      })
      .catch((err) => {
        console.log(err);
      });

    // Update the UI and show a simple IPFS Web Gateway URL where the site can be viewed
    const username = await wn.authenticatedUsername();
    const ipfsUrl = `https://${username}.files.fission.name/p/Apps/mumblr/`;

    buildSiteButton.value = "Build successful!";
    buildSiteButton.classList.add("success");
    const visitSiteLink = document.createElement("a");
    visitSiteLink.href = ipfsUrl;
    visitSiteLink.innerText = "Visit Site";
    visitSiteLink.className = "visit-site-link";
    buildSiteButton.insertAdjacentHTML("afterend", visitSiteLink.outerHTML);
    await enableBuildSiteButton();
  }
});

async function enableBuildSiteButton() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  buildSiteButton.disabled = false;
  buildSiteButton.classList.remove("success");
  buildSiteButton.value = "Build";
}
