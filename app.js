const express = require("express");
const path = require("path");
const dat = require("date-fns");
const isValid = require("date-fns/isValid");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");

let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

//////////////
const listenAndinitializeDb = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running at  : http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error :${err.message}`);
    process.exit(1);
  }
};
listenAndinitializeDb();
////////////
const midware = (request, response, next) => {};
// GET 1

app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
    date = "",
  } = request.query;
  const getPlayersSqlcode = `
    SELECT id,todo,priority,status,category,due_date AS dueDate
    FROM  todo
    WHERE status LIKE "%${status}%" AND priority LIKE "%${priority}%"
    AND todo LIKE "%${search_q}%" AND category LIKE "%${category}%"
    ORDER BY id;
   `;
  let validationList = [
    validDate(date),
    validPriority(priority),
    validStatus(status),
    validCategory(category),
  ];
  let overall = true;
  let current;
  for (let f of validationList) {
    if (f[0] !== true) {
      current = f[1];
      overall = false;
      break;
    }
  }
  if (overall) {
    const finalOutputArray = await db.all(getPlayersSqlcode);
    response.send(finalOutputArray);
  } else {
    response.status(400);
    response.send(`Invalid ${current}`);
  }
});

// GET 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  //   const { status, priority = "", search_q = "" } = request.query;
  const getPlayersSqlcode = `
    SELECT id,todo,priority,status,category,due_date AS dueDate
    FROM  todo
    WHERE id = ${todoId} ;
   `;

  const finalOutputArray = await db.get(getPlayersSqlcode);

  response.send(finalOutputArray);
});

// GET 3

app.get("/agenda/", async (request, response) => {
  const { todoId } = request.params;
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
    date = "",
  } = request.query;
  const getPlayersSqlcode = `
    SELECT id,todo,priority,status,category,due_date AS dueDate
    FROM  todo
    WHERE status LIKE "%${status}%" AND priority LIKE "%${priority}%"
    AND todo LIKE "%${search_q}%" AND category LIKE "%${category}%" AND strftime("%Y-%m-%d",due_date) = "${date}"
    ORDER BY id;
   `;
  let validationList = [
    validDate(date),
    validPriority(priority),
    validStatus(status),
    validCategory(category),
  ];
  let overall = true;
  let current;
  for (let f of validationList) {
    if (f[0] !== true) {
      current = f[1];
      overall = false;
      break;
    }
  }
  if (overall) {
    const finalOutputArray = await db.get(getPlayersSqlcode);
    response.send(finalOutputArray);
  } else {
    response.status(400);
    response.send(`Invalid ${current}`);
  }
});

//  POST 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const query = `
     INSERT INTO todo(id,todo,priority,status,category,due_date)
     VALUES (
         '${id}',
         '${todo}',
         '${priority}',
         '${status}',
         '${category}',
         DATE('${dueDate}')
     );
    `;
  let validationList = [
    validPriority(priority),
    validStatus(status),
    validCategory(category),
    validDate(dueDate),
  ];
  let overall = true;
  let current;
  for (let f of validationList) {
    if (f[0] !== true) {
      current = f[1];
      overall = false;
      break;
    }
  }
  if (overall) {
    const responseDb = await db.run(query);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send(`Invalid ${current}`);
  }
});

// PUT 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const unknownBody = request.body;
  let l;
  const { status, priority, todo, category, dueDate } = unknownBody; // dont know which reques is given so
  let knowColumn = ""; //other will be undefined  in that case
  let responseDb;
  switch (true) {
    case status !== undefined:
      knowColumn = "status";
      l = ["IN PROGRESS", "DONE", "TO DO"];
      if (l.includes(status)) {
        responseDb = await db.run(queryF(knowColumn, status));

        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      //queryF(knowColumn)

      break;
    case priority !== undefined:
      knowColumn = "priority";
      l = ["HIGH", "MEDIUM", "LOW"];
      if (l.includes(priority)) {
        responseDb = await db.run(queryF(knowColumn, priority));
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case todo !== undefined:
      knowColumn = "todo";
      //queryF(knowColumn)
      responseDb = await db.run(queryF(knowColumn, todo));
      response.send("Todo Updated");
      break;
    case category !== undefined:
      knowColumn = "category";
      l = ["HOME", "WORK"];
      //queryF(knowColumn)
      if (l.includes(category)) {
        responseDb = await db.run(queryF(knowColumn, category));
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case dueDate !== undefined:
      knowColumn = "due_date";
      //queryF(knowColumn)
      //DATE('${dueDate}')
      const valid = isValid(new Date(dueDate));
      if (valid) {
        responseDb = await db.run(queryD(knowColumn, dueDate));
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;

    // default:
    //   break;
  }
  function queryF(col, value) {
    const query = `UPDATE todo
                     SET 
                        ${col} = "${value}"
                       WHERE id = ${todoId} ;
                      `;
    return query;
  }
  function queryD(col, value) {
    const query = `UPDATE todo
                     SET 
                        ${col} = "${value}"
                       WHERE id = ${todoId} ;
                      `;
    return query;
  }
});

// DELETE 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const query = `
    DELETE FROM
        todo
    WHERE
      id = '${todoId}'
    ;
   `;
  const responseDb = await db.run(query);
  response.send("Todo Deleted");
});

let validDate = (dueDate) => {
  if (dueDate === "") {
    return [true];
  }
  const valid = isValid(new Date(dueDate));
  return [valid, "Due Date"];
};
let validPriority = (priority) => {
  if (priority === "") {
    return [true];
  }
  l = ["HIGH", "MEDIUM", "LOW"];
  return [l.includes(priority), "Todo Priority"];
};

let validStatus = (status) => {
  if (status === "") {
    return [true];
  }
  l = ["IN PROGRESS", "DONE", "TO DO"];
  return [l.includes(status), "Todo Status"];
};
let validCategory = (category) => {
  if (category === "") {
    return [true];
  }
  l = ["HOME", "WORK", "LEARNING"];
  return [l.includes(category), "Todo Category"];
};
module.exports = listenAndinitializeDb;
module.exports = app;
