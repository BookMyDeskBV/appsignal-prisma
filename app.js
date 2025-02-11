const { Appsignal } = require("@appsignal/nodejs");

const appsignal = new Appsignal({
  active: true,
  name: "prisma",
  pushApiKey: "PUSH-API-KEY",
  logPath: "logs",
  logLevel: "trace",
});

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const {
  expressMiddleware,
  expressErrorHandler,
} = require("@appsignal/express");
const prisma = new PrismaClient();
const app = express();
const port = 3000;

// ADD THIS AFTER ANY OTHER EXPRESS MIDDLEWARE, BUT BEFORE ANY ROUTES!
app.use(expressMiddleware(appsignal));

app.get("/", (req, res) => {
  getUsers()
    .catch((e) => {
      throw e;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });

  res.send("Hello World!");
});

// POST method route
app.post('/post', (req, res) => {
  getUsers()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  res.send('POST request')
})
// ADD THIS AFTER ANY OTHER EXPRESS MIDDLEWARE, AND AFTER ANY ROUTES!
app.use(expressErrorHandler(appsignal));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// A `main` function so that you can use async/await
async function getUsers() {
  const tracer = appsignal.tracer();

  // Record and log how long queries take:
  const startTime = new Date();
  const span = tracer.createSpan();
  span.setName(`Query.sql.user.get`);
  span.setCategory(`sql.getUsers`);

  const allUsers = await prisma.user.findMany({
    include: { posts: true },
  });

  const endTime = new Date();
  const took = endTime.getTime() - startTime.getTime(); // in ms
  // const took = Math.round(hrend[0] + hrend[1] / 10 ** 6); // convert to ms - 10 ** 6 = Math.pow(10, 6);
  console.log(`Query-get-users- took - ${took} -ms`);
  span.close();

  // use `console.dir` to print nested objects
  console.dir(allUsers, { depth: null });

  return allUsers;
}
