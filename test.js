const fs = require("fs");
//读数据库
const usersString = fs.readFileSync("./db/users.json").toString();
const usersArray = JSON.parse(usersString);
console.log(usersArray);
//写数据库
const users = { id: 3, name: "tom", password: "zzz" };
usersArray.push(users);
const string = JSON.stringify(usersArray);
fs.writeFileSync("./db/users.json", string);
