const {
  SyntheticsClient,
  CreateCanaryCommand,
} = require("@aws-sdk/client-synthetics"); // CommonJS import
const fs = require("fs");
const yaml = require("js-yaml");
const AdmZip = require("adm-zip");
const startCanary = require("./start-canary");

const args = process.argv;
const canaryName = args.slice(2).toString();

function getConfig() {
  try {
    return yaml.load(fs.readFileSync("config.yaml", "utf8"));
  } catch (e) {
    console.log(e);
  }
}

function zipFolder(folderPath, outputPath) {
  const zip = new AdmZip();
  const files = fs.readdirSync(folderPath, { withFileTypes: true });

  files.forEach((file) => {
    const filePath = `${folderPath}/${file.name}`;
    if (file.isDirectory()) {
      zip.addLocalFolder(filePath, file.name);
    } else {
      zip.addLocalFile(filePath);
    }
  });

  zip.writeZip(outputPath);
}

function encodeFileAsBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  return new Uint8Array(fileData);
}

async function main() {
  const config = getConfig();
  try {
    const inputFolderPath = `canary-js/${canaryName}`;
    const outputZipPath = `${canaryName}.zip`;
    const artifactS3Location = config.common.artifactS3Location;
    const executionRoleArn = config.common.executionRoleArn;
    const schedule = config.common.schedule;
    const runTimeVersion = config.common.runTimeVersion;
    const env = config.canaries[canaryName].env;
    const tags = config.canaries[canaryName].tags;

    zipFolder(inputFolderPath, outputZipPath);

    const encodedData = encodeFileAsBase64(outputZipPath);

    const input = {
      // CreateCanaryRequest
      Name: canaryName, // required
      Code: {
        // CanaryCodeInput
        ZipFile: encodedData,
        Handler: "index.handler", // required
      },
      ArtifactS3Location: artifactS3Location, // required
      ExecutionRoleArn: executionRoleArn, // required
      Schedule: {
        // CanaryScheduleInput
        Expression: schedule, // required
      },
      RunConfig: {
        // CanaryRunConfigInput
        TimeoutInSeconds: 300,
        MemoryInMB: 1000,
        ActiveTracing: true,
        EnvironmentVariables: env,
      },
      SuccessRetentionPeriodInDays: 31,
      FailureRetentionPeriodInDays: 31,
      RuntimeVersion: runTimeVersion, // required
      Tags: tags,
    };

    const client = new SyntheticsClient();
    const command = new CreateCanaryCommand(input);
    const response = await client.send(command);

    await startCanary(canaryName);

    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

main();
