const http = require("http");

function compose(middleware) {
  if (!Array.isArray(middleware))
    throw new TypeError("Middleware stack must be an array!");
  for (const fn of middleware) {
    if (typeof fn !== "function")
      throw new TypeError("Middleware must be composed of functions!");
  }

  return function (context) {
    let index = -1;

    return dispatch(0);
    function dispatch(i) {
      if (i <= index)
        return Promise.reject(new Error("next() called multiple times"));
      index = i;
      let fn = middleware[i];
      if (!fn) {
        return Promise.resolve();
      }

      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

class Application {
  constructor() {
    this.middleWare = [];
  }

  listen(...args) {
    const server = http.createServer(this.callback());

    return server.listen(...args);
  }

  use(fn) {
    if (typeof fn !== "function") {
      throw new TypeError("middleware must be a function");
    }
    this.middleWare.push(fn);
    return this;
  }

  createContext(req, res) {
    return {
      req,
      res,
    };
  }

  handleRequest(ctx, fnMiddleware) {
    return fnMiddleware(ctx);
  }

  callback() {
    const fn = compose(this.middleWare);

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }
}

const app = new Application();

app.use(async (ctx, next) => {
  next();
});

app.use((ctx, next) => {
  ctx.res.end("456");
});

app.listen(8080, () => {
  console.log("server");
});
