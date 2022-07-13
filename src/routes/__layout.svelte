<script>
	import '../app.css';
</script>

<button id="connect-disconnect" type="submit" class="connect-disconnect">
	<img src="./plugin-connecting.svg" id="connecting-icon" />
</button>

<input id="build-button" type="submit" class="build-button" value="Build" />
<h1 class="title">mumblr</h1>
<h2 class="subtitle">Write stuff. Store it in IPFS.</h2>
<slot />

<footer>
	<p>
		A <a href="https://fission.codes">Fission</a> experiment by
		<a href="https://jessmart.in">Jess Martin</a>.
	</p>
</footer>
