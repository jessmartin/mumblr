import "./style.css";
import * as wn from "webnative";
import FileSystem from "webnative/fs/index";

const state = await wn
  .initialise({
    permissions: {
      app: {
        name: "fumblr",
        creator: "Jess Martin",
      },
      fs: {
        private: [wn.path.directory("Posts", "Private")],
        public: [wn.path.directory("Posts", "Public")],
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

let fs: FileSystem | undefined;

switch (state?.scenario) {
  case wn.Scenario.AuthCancelled:
    break;

  case wn.Scenario.AuthSucceeded:
  case wn.Scenario.Continuation:
    // TODO: Maybe put some 'logged in' state at the top right?
    fs = state.fs;
    break;

  case wn.Scenario.NotAuthorised:
    wn.redirectToLobby(state.permissions);
    break;
}

const post = document.querySelector<HTMLInputElement>("#post")!;

post.addEventListener("click", function () {
  console.log("attempting to save file");
  const title = document.querySelector<HTMLInputElement>(".title-input")!;
  const body = document.querySelector<HTMLTextAreaElement>(".body-input")!;
  if (fs !== undefined && fs.appPath !== undefined) {
    fs.add(`${fs.appPath()}/Posts/Public/${title.value}.md`, body.value).then(
      console.log("saved file")
    );
  }
});
