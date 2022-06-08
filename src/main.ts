import "./style.css";
import * as wn from "webnative";
import FileSystem from "webnative/fs/index";

const state = await wn
  .initialise({
    permissions: {
      app: {
        name: "mumblr",
        creator: "Jess Martin",
      },
      fs: {
        private: [wn.path.directory("Posts")], // This will be `private/Posts`
        public: [wn.path.directory("Posts")], // This will be `public/Posts`
      },
    },
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
wn.setup.debug({ enabled: true });

let fs: FileSystem | undefined;

switch (state?.scenario) {
  case wn.Scenario.AuthCancelled:
    console.log("Auth cancelled by user");
    break;

  case wn.Scenario.AuthSucceeded:
  case wn.Scenario.Continuation:
    // TODO: Maybe put some 'logged in as' state at the top right?
    console.log("Logged in");
    fs = state.fs;
    break;

  case wn.Scenario.NotAuthorised:
    wn.redirectToLobby(state.permissions);
    console.log("Redirected to lobby");
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

const logOut = document.querySelector<HTMLInputElement>("#connect-disconnect")!;
logOut.addEventListener("click", async function () {
  wn.leave().then(() => {
    console.log("Logged out");
  });
});
