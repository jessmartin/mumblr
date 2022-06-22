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

const permissions = {
  app: {
    name: "mumblr",
    creator: "Jess Martin",
  },
  fs: {
    private: [wn.path.directory("Posts")], // This will be `private/Posts`
    public: [wn.path.directory("Posts")], // This will be `public/Posts`
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
    connectionStatus.value = "C";
    connectionStatus.style.color = "green";
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
    connectionStatus.value = "D";
    connectionStatus.style.color = "red";
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
  if (fs !== undefined) {
    const linksObject = await fs.ls(wn.path.directory("public", "Posts"));
    const links = Object.entries(linksObject);
    const posts = await Promise.all(
      links.map(([name, _]) => {
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
  }
  // Build the HTML/CSS

  // Load the template HTML file locally
  const template = await fetch("/template.html");
  console.log(await template.text());

  // Write the static site to IPFS

  // Show a simple IPFS Web Gateway URL where the site can be viewed
});
