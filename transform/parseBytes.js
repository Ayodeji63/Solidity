const ethers = require("ethers");

async function parseBytes(args) {
  const parse = args[0];
  const name = ethers.utils.parseBytes32String(parse);
  console.log("Bytes: ", name);
}

parseBytes(process.argv.slice(2));
