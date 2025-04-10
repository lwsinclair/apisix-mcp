import { DeleteResourceSchema, GetResourceSchema, SendRequestSchema } from "../schemas/common.js";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import axios, { AxiosRequestConfig, AxiosError } from "axios";

import { APISIX_SERVER_PORT, APISIX_SERVER_HOST } from "../utils/env.js";
import makeAdminAPIRequest from "../utils/adminAPI.js";
interface RequestConfig {
  path: AxiosRequestConfig['url'];
  method: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  headers?: AxiosRequestConfig['headers'];
  repeatCount?: number;
}

const setupCommonTools = (server: McpServer) => {
  server.tool("get_resource", "Get resource details by ID or list all resources", GetResourceSchema.shape, async (args) => {
    if (args.id) {
      return await makeAdminAPIRequest(`/${args.type}/${args.id}`);
    } else {
      let query = "";
      if (args.name) {
        query += `&name=${args.name}`;
      }
      if (args.labels) {
        query += `&labels=${args.labels}`;
      }
      if (args.uri) {
        query += `&uri=${args.uri}`;
      }
      return await makeAdminAPIRequest(`/${args.type}?page=${args.page}&page_size=${args.page_size}${query}`);
    }
  });

  server.tool("delete_resource", "Delete a resource by ID", DeleteResourceSchema.shape, async (args) => {
    return await makeAdminAPIRequest(`/${args.type}/${args.id}`, "DELETE");
  });

  server.tool("send_request_to_gateway", "Send a request or multiple requests to the APISIX gateway", SendRequestSchema.shape, async (args) => {
    const makeRequest = async (config: RequestConfig) => {
      try {
        const response = await axios.request({
          url: `${APISIX_SERVER_HOST}:${APISIX_SERVER_PORT}${config.path}`,
          method: config.method,
          data: config.data,
          headers: config.headers,
          timeout: 10000,
        });

        return {
          status: response.status,
          data: response.data,
          headers: response.headers,
        };
      } catch (error) {
        // handle error
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          // The server responded with an error status code
          return {
            status: axiosError.response.status,
            data: axiosError.response.data || { error: 'Request failed' },
            headers: axiosError.response?.headers || {},
          };
        } else if (axiosError.request) {
          // The request was sent but no response was received
          return {
            status: 503, // Use 503 to indicate service is unavailable
            data: { error: 'Gateway is not responding' },
            headers: axiosError.request?.headers || {},
          };
        } else {
          // An error occurred while setting up the request
          return {
            status: 500,
            data: { error: axiosError.message || 'Request error' },
            headers: axiosError.request?.headers || {},
          };
        }
      }
    };

    const makeRepeatedRequests = async (config: RequestConfig) => {
      const repeatCount = config.repeatCount || 1;
      if (repeatCount > 1) {
        return Promise.all(Array(repeatCount).fill(null).map(() => makeRequest(config)));
      } else {
        return makeRequest(config);
      }
    };

    let results = [];
    results = await Promise.all(args.requests.map(req => makeRepeatedRequests(req)));


    // Flatten results if needed and count
    const flatResults = results.flat();
    const singleResults = flatResults.filter(r => !Array.isArray(r));
    const multiResults = flatResults.filter(r => Array.isArray(r)).flat();
    const allResults = [...singleResults, ...multiResults];

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          results: allResults,
          summary: {
            total: allResults.length,
            successful: allResults.filter(r => r.status >= 200 && r.status < 300).length,
            failed: allResults.filter(r => r.status >= 400).length
          }
        }, null, 2)
      }]
    };
  });
};

export default setupCommonTools;
