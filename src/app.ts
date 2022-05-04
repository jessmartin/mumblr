import * as wn from 'webnative';

function greet(name: string) {
  const greeting = document.createElement('h1');
  greeting.textContent = `Hello ${name}`;
  document.body.appendChild(greeting);
}

greet('TypeScript');

const state = await wn
  .initialise({
    permissions: {
      // Will ask the user permission to store
      // your apps data in `private/Apps/Nullsoft/Winamp`
      app: {
        name: 'Winamp',
        creator: 'Nullsoft'
      },

      // Ask the user permission to additional filesystem paths
      fs: {
        private: [wn.path.directory('Audio', 'Music')],
        public: [wn.path.directory('Audio', 'Mixtapes')]
      }
    }
  })
  .catch((err: any) => {
    switch (err) {
      case wn.InitialisationError.InsecureContext:
      // We need a secure context to do cryptography
      // Usually this means we need HTTPS or localhost

      case wn.InitialisationError.UnsupportedBrowser:
      // Browser not supported.
      // Example: Firefox private mode can't use indexedDB.
    }
  });
