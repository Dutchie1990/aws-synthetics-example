const args = process.argv;
const canaryName = args.slice(2).toString();

const {
  SyntheticsClient,
  DeleteCanaryCommand,
} = require("@aws-sdk/client-synthetics"); // CommonJS import
const stopCanary = require("./stop-canary");

async function main() {
  try {
    await stopCanary(canaryName);
    const client = new SyntheticsClient();
    const input = {
      // DeleteCanaryRequest
      Name: canaryName, // required
      DeleteLambda: true,
    };
    const command = new DeleteCanaryCommand(input);
    const response = await client.send(command);
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

main();
