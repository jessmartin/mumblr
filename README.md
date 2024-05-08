> [!WARNING]
> [Fission is winding down](https://fission.codes/blog/farewell-from-fission/) and the infra needed for this app is no longer hosted by them. Use this as reference only.

# mumblr: blogging, decentralized.

**Micro-blogging in the vein of [tumblr](https://tumblr.com).** Remember tumblr? Me too. A simpler age of blogging. Longer than a tweet. Shorter than a Medium post. Lighter. More ephemeral. More fun. On the surface, mumblr is "self-hosted" microblogging in the spirit of tumblr. But beneath the surface lie some surprises...

Conceptually, mumblr consists of two components:

- A User Interface for writing blog posts in markdown and storing them to IPFS.
- A static site generator that reads blog posts from IPFS, generates a static website, and writes that site to IPFS.

## What makes mumblr different from other blogging platforms?

- **No user accounts.** Rather than creating an account with a username and password, mumblr asks for your permission to access to write and read data on your behalf. This permission is secured by a private key that resides in your browser and never leaves your local machine; all requests go directly from your browser to the IPFS network.
- **You own your data.** The mumblr user interface requests access to storage in IPFS that belongs to you and is secured by your keys. This storage is accessible by your keys using other IPFS-enabled applications such as [Fission Drive]().
- **Bring your own client.** As a consequence of _You own your data_, you can edit the data mumblr creates directly, bypassing mumblr's user interface. For example, you could use a CLI tool to place additional markdown files in IPFS and mumblr will see them the next time you load the user interface.
- **No backend.** Mumblr is a simple front-end application. There are no servers. Every action is initiated by the front-end application loaded in your browser. The storage layer is backed by IPFS.
- **Separation between content and presentation.** Mumblr's conceptual architecture separates the "writing" process from "site generation." Technically, each function can be used independently. You can use mumblr's UI to write posts. Or not. You can use mumblr's static site generator to generate the blog. Or not. They go together like peanut butter and jelly, but each is delicious on it's own.

## How mumblr works

Mumblr inherits much of the above functionality from Fission's [WebNative library](https://guide.fission.codes/developers/webnative). WebNative handles a lot for mumblr, letting mumblr focus on it's unique function: the user interface for writing and the static site generation. Here are a few things handled by WebNative:

- [authentication with WebCrypto and UCAN](https://guide.fission.codes/developers/webnative/auth): the creation of keys in the user's browser and the delegation of permissions from the user to mumblr via UCANs.
- [storage with WNFS](https://guide.fission.codes/developers/webnative/file-system-wnfs): creating and managing a filesystem for the user in IPFS, wrapping IPFS with some handy methods for reading and writing to that file system.

WebNative also provides an [app publishing system](https://guide.fission.codes/developers/webnative/platform), but I'm not currently taking advantage of that.

## Watch me build it

<img width="600" alt="Livestream of building mumblr" src="https://user-images.githubusercontent.com/27258/175131445-45121e18-4707-435e-bb45-5fa15834de96.png">

I've been livestreaming most of my work on mumblr. You can view past livestreams in [this playlist](https://www.youtube.com/playlist?list=PLR5cUEyS7wdhcv8v2KDOwRkyP9EPKOHmA).

## FAQ

Q: What's IPFS?

A: [IPFS](https://ipfs.io) stands for Interplanetary File System. It's a distributed, peer-to-peer, content-addressed storage protocol. If you want a simple analogy, it's BitTorrent meets the Internet Archive. Going a bit deeper, it's a powerful and future-proof way of storing content on the web.

Q: Is the "m" in mumblr capitalized or lowercase?

A: Mumblr prefers to be capitalized when at the beginning of a sentence. When occurring within a sentence, mumblr prefers to be lowercase.
