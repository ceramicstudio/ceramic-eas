# Save Attestations to Ceramic Network with EAS

This repository contains a simple example of how to save attestations generated using the Ethereum Attestation Service to the Ceramic Network using ComposeDB.

## Getting Started

1. Install your dependencies:

```bash
npm install
```

2. Generate your admin seed, admin did, and ComposeDB configuration file:

```bash
npm run generate
```

3. Create a .env file and enter the three required environment variables outlined in .env.example

```bash
cp .env.example .env
```

You will need an API key from Alchemy. You can also create a separate seed for your `AUTHOR_KEY` value by running the following:

```bash
npm run seed
```

4. Run the application (make sure you are using node version 20):

#### Development
```bash
npm run dev
```

## Learn More

To learn more about Ceramic please visit the following links

- [Ethereum Attestation Service](https://attest.sh/) - Details on how to define attestation schemas and create on/off-chain attestations!
- [Ceramic Documentation](https://developers.ceramic.network/learn/welcome/) - Learn more about the Ceramic Ecosystem.
- [ComposeDB](https://developers.ceramic.network/docs/composedb/getting-started) - Details on how to use and develop with ComposeDB!

