const {
  SyntheticsClient,
  StopCanaryCommand,
  GetCanaryCommand,
} = require("@aws-sdk/client-synthetics");

async function pollCanaryStatus(client, canaryName) {
  const input = {
    // GetCanaryRequest
    Name: canaryName, // required
  };

  try {
    const getCommand = new GetCanaryCommand(input);
    let ready = false;
    let counter = 0;
    while (!ready && counter < 10) {
      const response = await client.send(getCommand);
      if (response.Canary.Status.State === "STOPPED") {
        console.log("Canary is stopped.");
        ready = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds
        counter++;
      }
    }
  } catch (error) {
    console.error("Error getting canary status:", error);
  }
}

// Define the function
async function stopCanary(canaryName) {
  const client = new SyntheticsClient();
  const input = {
    // StartCanaryRequest
    Name: canaryName, // required
  };
  const command = new StopCanaryCommand(input);
  client.send(command).then((res) => console.log(res));
  await pollCanaryStatus(client, canaryName);
}

module.exports = stopCanary;
