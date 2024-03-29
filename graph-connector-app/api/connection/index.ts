// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { Context, HttpRequest } from "@azure/functions";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { AppCredential, AppCredentialAuthConfig } from "@microsoft/teamsfx";
import config from "../config";

interface Response {
  status: number;
  body: { [key: string]: any };
}

const authConfig: AppCredentialAuthConfig = {
  authorityHost: config.authorityHost,
  clientId: config.clientId,
  tenantId: config.tenantId,
  clientSecret: config.clientSecret,
};

type TeamsfxContext = { [key: string]: any };

/**
 * @param {Context} context - The Azure Functions context object.
 * @param {HttpRequest} req - The HTTP request.
 * @param {teamsfxContext} TeamsfxContext - The context generated by teamsfx binding.
 */
export default async function run(
  context: Context,
  req: HttpRequest,
  teamsfxContext: TeamsfxContext
): Promise<Response> {
  context.log("HTTP trigger function processed a request.");

  const connectionId = req.query.connectionId;

  // Initialize response.
  const res: Response = {
    status: 200,
    body: {
      connectionAlreadyExists: false,
    },
  };

  let appCredential;
  try {
    appCredential = new AppCredential(authConfig);
  } catch (e) {
    context.log.error(e);
    return {
      status: 500,
      body: {
        error:
          "Failed to construct TeamsFx with Application Identity. " +
          "Ensure your function app is configured with the right Azure AD App registration.",
      },
    };
  }

  // Create connection
  try {
    // Create an instance of the TokenCredentialAuthenticationProvider by passing the tokenCredential instance and options to the constructor
    const authProvider = new TokenCredentialAuthenticationProvider(
      appCredential,
      {
        scopes: ["https://graph.microsoft.com/.default"],
      }
    );
    const graphClient: Client = Client.initWithMiddleware({
      authProvider: authProvider,
    });
    await graphClient.api("/external/connections").post({
      id: connectionId,
      name: "Sample connection",
      description: "Sample connection description",
    });
  } catch (e) {
    if (e?.statusCode === 409) {
      res.body.connectionAlreadyExists = true;
    } else {
      context.log.error(e);
      let error =
        "Failed to create a connection for Graph connector: " + e.toString();
      if (e?.statusCode === 401) {
        error +=
          " -- Please make sure you have done 'Admin Consent' with 'ExternalConnection.ReadWrite.OwnedBy' and 'ExternalItem.ReadWrite.All' application permissions for your AAD App";
      }
      return {
        status: e?.statusCode ?? 500,
        body: {
          error,
        },
      };
    }
  }

  return res;
}
