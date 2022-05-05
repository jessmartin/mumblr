import "./style.css";
import * as wn from "webnative";

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

switch (state?.scenario) {
  case wn.Scenario.AuthCancelled:
    break;

  case wn.Scenario.AuthSucceeded:
  case wn.Scenario.Continuation:
    state.fs;
    break;

  case wn.Scenario.NotAuthorised:
    wn.redirectToLobby(state.permissions);
    break;
}
