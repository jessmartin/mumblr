import "./style.css";
import * as wn from "webnative";
import FileSystem from "webnative/fs/index";

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
