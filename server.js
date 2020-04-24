var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
  console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
  process.exit(1);
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = "";
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
  }
  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;

  /******** 从这里开始看，上面不要看 ************/

  console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);
  const session = JSON.parse(fs.readFileSync("./session.json").toString());

  if (path === "/sign-in" && method === "POST") {
    response.setHeader("Content-Type", `text/html,charset = utf - 8`);
    const usersArray = JSON.parse(fs.readFileSync("./db/users.json"));
    const array = [];
    request.on("data", (chunk) => {
      array.push(chunk);
    });

    request.on("end", () => {
      //把字符编码变成字符串
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      const user = usersArray.find(
        //user为数组里面的元素
        (user) => user.name === obj.name && user.password === obj.password
      );
      if (user === undefined) {
        response.statusCode = 400;
        response.end(`{"errorCode:4001"}`);
      } else {
        response.statusCode = 200;
        const random = Math.random();

        session[random] = { user_id: user.id };
        fs.writeFileSync("./session.json", JSON.stringify(session));
        response.setHeader("Set-Cookie", `session_id=${random}; HttpOnly`);
      }
      response.end();
    });
    //home.html
  } else if (path === "/home.html") {
    const cookie = request.headers["cookie"];
    console.log(cookie);
    let sessionId;
    try {
      sessionId = cookie
        .split(";")
        .filter((s) => s.indexOf("session_id") >= 0)[0]
        .split("=")[1];
    } catch (error) {}
    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id;
      const usersArray = JSON.parse(fs.readFileSync("./db/users.json"));
      const user = usersArray.find((user) => user.id === userId);
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      let string;
      if (user) {
        const string = homeHtml
          .replace("{{loginStatus}}", "已登录")
          .replace("{{user.name}}", user.name);
        response.write(string);
      }
    } else {
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      const string = homeHtml
        .replace("{{loginStatus}}", "未登录")
        .replace("{{user.name}}", "");
      response.write(string);
    }
    response.end();
    //sign-up.html
  } else if (path === "/sign-up" && method === "POST") {
    response.setHeader("Content-Type", `text/html,charset = utf - 8`);
    const usersArray = JSON.parse(fs.readFileSync("./db/users.json"));
    const array = [];
    request.on("data", (chunk) => {
      array.push(chunk);
    });
    request.on("end", () => {
      //把字符编码变成字符串
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      //id为最后一个用户的id+1
      const lastUser = usersArray[usersArray.length - 1];
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password,
      };
      usersArray.push(newUser);
      fs.writeFileSync("./db/users.json", JSON.stringify(usersArray));
    });

    response.end("");
  } else {
    response.statusCode = 200;
    //默认首页
    const filePath = path === "/" ? "/index.html" : path;
    const index = filePath.lastIndexOf(".");
    const suffix = filePath.substring(index);
    const fileType = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };
    response.setHeader(
      "Content-Type",
      `${fileType[suffix] || "text/html"};charset=utf-8`
    );
    let content;
    try {
      content = fs.readFileSync(`./public${filePath}`);
    } catch (error) {
      content = "文件不存在";
      response.statusCode = 404;
    }

    response.write(content);
    response.end();
  }

  /******** 代码结束，下面不要看 ************/
});

server.listen(port);
console.log(
  "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
);
