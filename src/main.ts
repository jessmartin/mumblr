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
import DisconnectedSvg from '../plugin-disconnected.svg'


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
    connectionStatus.innerHTML = `<img src="${ConnectedIcon}" id="connect-disconnect-icon" >`
    fs = state.fs; // Load the filesystem
    connectionStatus.addEventListener("click", async function () {
      wn.leave().then(() => {
        console.log("Disconnected");
      });
    });
    // Enable the UI
    document.querySelector<HTMLButtonElement>("#post")!.disabled = false;
    document.querySelector<HTMLInputElement>("#title-input")!.disabled = false;
    document.querySelector<HTMLTextAreaElement>("#body-input")!.disabled =
      false;
    break;

  case wn.Scenario.NotAuthorised:
    connectionStatus.innerHTML= `<img src="${DisconnectedSvg}" id="connect-disconnect-icon" >`
    connectionStatus.addEventListener("click", async function () {
      console.log("Redirected to lobby");
      wn.redirectToLobby(permissions);
    });
    console.log("Not connected");
    break;
}

const post = document.querySelector<HTMLInputElement>("#post")!;

post.addEventListener("click", async function () {
  console.log("attempting to save file");
  const title = document.querySelector<HTMLInputElement>(".title-input")!;
  // If title is blank, don't allow saving?

  const body = document.querySelector<HTMLTextAreaElement>(".body-input")!;
  // If body is blank, don't allow saving?

  if (fs !== undefined) {
    const filePath = wn.path.file("public", "Posts", `${title.value}.md`);
    await fs.add(filePath, body.value).then(() => {
      console.log("file saved");
    });
    await fs
      .publish()
      .then(() => {
        console.log("file system published");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("no file system");
  }
});

const buildSiteButton =
  document.querySelector<HTMLInputElement>("#build-button")!;

buildSiteButton.addEventListener("click", async function () {
  console.log("attempting to build site");
  // Read the most recent Markdown files
  let markdownPosts = [];
  // TODO: Make this into a "break" statement
  if (fs !== undefined) {
    const linksObject = await fs.ls(wn.path.directory("public", "Posts"));
    const links = Object.entries(linksObject);

    // If file is a directory, skip it
    const files = await Promise.all(
      links.filter((link) => (link[1] as object).isFile)
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
        new Date(b.data.postedAt as string).getTime() -
        new Date(a.data.postedAt as string).getTime()
      );
    });
    console.log(markdownPosts);
    // Build the HTML/CSS

    // Load the template HTML file locally
    const template = await fetch("/template.html");
    const templateString = await template.text();
    const parser = new DOMParser();
    const templateDoc = parser.parseFromString(templateString, "text/html");

    // Generate the HTML for each markdown post and insert into template html
    const blogPostsDiv = document.createElement("div");
    // iterate over the posts
    for await (const markdownPost of markdownPosts) {
      const postDate = markdownPost.data.postedAt as Date;
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
          <a class="datestamp" href="#" title="Updates on this date">${postDateString}</a>
          <!-- <a class="clockstamp" href="/updates/???" title="Permalink to this update">???</a> -->
        </div>
        <div class="update-s">
          ${markdownPost.value}
        </div>
      </div>
      `;
      blogPostsDiv.appendChild(postDiv);
    }
    const feedDiv = templateDoc.querySelector("div.feed");
    feedDiv?.appendChild(blogPostsDiv);

    // Write the static site to IPFS
    // Write the template HTML to index.html
    const indexHtmlPath = wn.path.file(
      "public",
      "Apps",
      "mumblr",
      "index.html"
    );
    const serializer = new XMLSerializer();
    const templateDocString = serializer.serializeToString(templateDoc);

    await fs.add(indexHtmlPath, templateDocString).then(() => {
      console.log("blog posts saved");
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
      console.log("stylesheet saved");
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
  }
});
