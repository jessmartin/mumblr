import * as wn from 'webnative';
import type FileSystem from 'webnative/fs/index';

let state: wn.State;

const permissions = {
	app: {
		name: 'mumblr',
		creator: 'Jess Martin'
	},
	fs: {
		private: [wn.path.directory('Posts')], // This will be `private/Posts`
		public: [wn.path.directory('Posts'), wn.path.directory('Apps', 'mumblr')] // This will be `public/Posts`
	}
};

wn.setup.debug({ enabled: true });

export const initialize = async (): Promise<void> => {
	try {
		const st = await wn.initialise({ permissions: permissions });
		state = st;

		switch (state?.scenario) {
			case wn.Scenario.AuthCancelled:
				console.log('Auth cancelled by user');
				break;

			case wn.Scenario.AuthSucceeded:
			// New permissions have been granted
			// eslint-disable-next-line no-fallthrough
			case wn.Scenario.Continuation:
				// Great success! We can now use the filesystem!
				console.log('Connected');
				// connectionStatus.innerHTML = `<img src="${ConnectedIcon}" id="connect-disconnect-icon" >`;
				// fs = state.fs; // Load the filesystem
				// connectionStatus.addEventListener('click', async function () {
				// 	wn.leave().then(() => {
				// 		console.log('Disconnected');
				// 	});
				// });
				// Enable the UI
				// document.querySelector<HTMLButtonElement>('#post')!.disabled = false;
				// document.querySelector<HTMLTextAreaElement>('#body-input')!.disabled = false;
				break;

			case wn.Scenario.NotAuthorised:
				// connectionStatus.innerHTML = `<img src="${DisconnectedSvg}" id="connect-disconnect-icon" >`;
				// connectionStatus.addEventListener('click', async function () {
				// 	console.log('Redirected to lobby');
				// 	wn.redirectToLobby(permissions);
				// });
				console.log('Not connected');
				break;
		}
	} catch (err) {
		switch (err) {
			case wn.InitialisationError.InsecureContext:
			// TODO: Notify the user that the app is not secure
			// eslint-disable-next-line no-fallthrough
			case wn.InitialisationError.UnsupportedBrowser:
			// TODO: Notify the user of the error
		}
	}
};

interface StateFS {
	fs?: FileSystem;
}

// export const getWNFS: () => FileSystem = () => (state as StateFS)?.fs;
