# Solana dApp Store

Scaffold only; nothing here has been published.

1. Build a signed release APK locally (`npx expo prebuild -p android && cd android && ./gradlew assembleRelease`) with your own upload keystore kept outside the repo.
2. `npx @solana-mobile/dapp-store-cli init`, then fill the placeholders in `config.yaml`.
3. `create publisher`, `create app`, `create release` with a publisher keypair stored outside this repo (each mints an NFT and costs a little SOL).
4. `publish submit` after review of the release.
