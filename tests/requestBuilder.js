import orchestrator from "./orchestrator";

export default class RequestBuilder {
  baseUrl = "";
  headers;

  constructor(urlSegments = "") {
    this.baseUrl = urlSegments.startsWith("http")
      ? urlSegments
      : `${orchestrator.webserverUrl}${urlSegments}`;
  }

  async get(route = "") {
    if (!this.headers) {
      this.buildHeaders();
    }

    const res = await fetch(`${this.baseUrl}${route}`, {
      method: "GET",
      headers: this.headers,
    });

    const resBody = await res.json();

    return { res, resBody };
  }

  async post(routeOrRequestBody, inputRequestBody) {
    const { route, reqBody } = this.getRouteAndRequestBody(
      routeOrRequestBody,
      inputRequestBody,
    );

    if (!this.headers) {
      this.buildHeaders();
    }

    const fetchData = {
      method: "POST",
      headers: this.headers,
    };

    if (reqBody) {
      fetchData.body =
        typeof reqBody === "object" ? JSON.stringify(reqBody) : reqBody;
    }

    const res = await fetch(`${this.baseUrl}${route}`, fetchData);

    const resBody = await res.json();

    return { res, resBody };
  }

  async delete(routeOrRequestBody, inputRequestBody) {
    const { route, reqBody } = this.getRouteAndRequestBody(
      routeOrRequestBody,
      inputRequestBody,
    );

    if (!this.headers) {
      this.buildHeaders();
    }

    const fetchData = {
      method: "DELETE",
      headers: this.headers,
    };

    if (reqBody) {
      fetchData.body =
        typeof reqBody === "object" ? JSON.stringify(reqBody) : reqBody;
    }

    const res = await fetch(`${this.baseUrl}${route}`, fetchData);

    const resBody = await res.json();

    return { res, resBody };
  }

  async patch(routeOrRequestBody, inputRequestBody) {
    const { route, reqBody } = this.getRouteAndRequestBody(
      routeOrRequestBody,
      inputRequestBody,
    );

    if (!this.headers) {
      this.buildHeaders();
    }

    const fetchData = {
      method: "PATCH",
      headers: this.headers,
    };

    if (reqBody) {
      fetchData.body =
        typeof reqBody === "object" ? JSON.stringify(reqBody) : reqBody;
    }

    const res = await fetch(`${this.baseUrl}${route}`, fetchData);

    const resBody = await res.json();

    return { res, resBody };
  }

  buildHeaders(customHeaders) {
    const headers = {
      "Content-Type": "application/json",
    };

    this.headers = { ...headers, ...customHeaders };
    return this.headers;
  }

  getRouteAndRequestBody(routeOrRequestBody = "", inputRequestBody) {
    let route = routeOrRequestBody;
    let reqBody = inputRequestBody;

    if (typeof routeOrRequestBody === "object") {
      route = "";
      reqBody = routeOrRequestBody;
    }

    return {
      route: route,
      reqBody,
    };
  }
}
