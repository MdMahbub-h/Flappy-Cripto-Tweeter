const express = require("express");
const ejs = require("ejs");
const path = require("path");
const http = require("http");
const dotenv = require("dotenv");
const session = require("express-session");
const { Server } = require("socket.io");
const { initializeApp } = require("firebase/app");
const { request } = require("undici");
const { getDatabase, ref, get, set, update, remove } = require("firebase/database");

dotenv.config();

const port = process.env.PORT || 3000;

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    name: "flappy-crypto",
    secret: "fghy654$5tgRrr",
    resave: false,
    saveUninitialized: true,
  })
);

const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({ err: { message: err.message } });
};

app.use(errorHandler);

app.get("/login", async (req, res) => {
  const getTwitterOauthUrl = () => {
    const rootUrl = "https://twitter.com/i/oauth2/authorize";
    const options = {
      redirect_uri: "http://www.localhost:3002/auth/twitter", // client url cannot be http://localhost:3000/ or http://127.0.0.1:3000/
      client_id: TWITTER_CLIENT_ID,
      state: "state",
      response_type: "code",
      code_challenge: "y_SfRG4BmOES02uqWeIkIgLQAlTBggyf_G7uKT51ku8",
      code_challenge_method: "S256",
      scope: ["users.read", "tweet.read", "tweet.write"].join(" "), // add/remove scopes as needed
    };
    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  };

  const url = getTwitterOauthUrl();
  return res.render("login", { url });
});

const twitterOauthTokenParams = {
  client_id: TWITTER_CLIENT_ID,
  code_verifier: "8KxxO-RPl0bLSxX5AWwgdiFbMnry_VOKzFeIlVA7NoA",
  redirect_uri: "http://www.localhost:3002/auth/twitter",
  grant_type: "authorization_code",
};

const BasicAuthToken = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`, "utf8").toString("base64");

async function getTwitterOAuthToken(code) {
  try {
    const { body } = await request("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${BasicAuthToken}`,
      },
      body: new URLSearchParams({ ...twitterOauthTokenParams, code }).toString(),
    });
    const data = await body.json();
    if (data.error) {
      throw new Error("Failed to get auth token");
    }
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getTwitterUser(accessToken) {
  try {
    const { body } = await request("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await body.json();
    if (!data.data) {
      throw new Error("Failed to get user data");
    }
    return data.data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

app.get("/auth/twitter", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect("/login");
  }

  const oAuthToken = await getTwitterOAuthToken(code);
  if (!oAuthToken) {
    return res.redirect("/login");
  }

  const twitterUser = await getTwitterUser(oAuthToken.access_token);
  if (!twitterUser) {
    return res.redirect("/login");
  }

  req.session.user = twitterUser;
  req.session.access_token = oAuthToken.access_token;

  return res.redirect("/");
});

app.get("/", async (req, res) => {
  console.log(req.session.user);
  console.log(req.session.access_token);
  if (req.session.user && req.session.access_token) {
    return res.render("index", {
      user: req.session.user,
      token: req.session.access_token,
    });
  } else {
    return res.redirect("/login");
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const firebase = initializeApp({
  apiKey: "AIzaSyALswdE4EclGpsyA4FYVcL0RYe9HZd6vf4",
  authDomain: "article-bcccc.firebaseapp.com",
  databaseURL: "https://article-bcccc-default-rtdb.firebaseio.com",
  projectId: "article-bcccc",
  storageBucket: "article-bcccc.appspot.com",
  messagingSenderId: "558259234111",
  appId: "1:558259234111:web:8b89fa061e0f5a7e189f8a",
});

const db = getDatabase(firebase);

const getCodes = (score, codes = "[]") => {
  let unlocked = null;
  let newCodes = [];
  try {
    const _codes = JSON.parse(codes);
    if (Array.isArray(_codes)) {
      newCodes = _codes;
    }
  } catch (err) {
    console.log(err);
  }

  if (score >= 500) {
    const cd5h = newCodes.find((cd) => cd.points == "500");
    if (!cd5h) {
      const code = Math.floor(Math.random() * 900000) + 100000;
      unlocked = {
        points: "500",
        code: code,
      };
      newCodes.push(unlocked);
    }
  }

  if (score >= 1000) {
    const cd1k = newCodes.find((cd) => cd.points == "1000");
    if (!cd1k) {
      const code = Math.floor(Math.random() * 900000) + 100000;
      unlocked = {
        points: "1000",
        code: code,
      };
      newCodes.push(unlocked);
    }
  }

  if (score >= 5000) {
    const cd5k = newCodes.find((cd) => cd.points == "5000");
    if (!cd5k) {
      const code = Math.floor(Math.random() * 900000) + 100000;
      unlocked = {
        points: "5000",
        code: code,
      };
      newCodes.push(unlocked);
    }
  }

  return { codes: JSON.stringify(newCodes), unlocked };
};

const storeData = async (data, codes) => {
  try {
    await set(ref(db, `scores/${data.username}`), {
      username: data.username,
      name: data.name,
      score: data.score,
      codes: codes,
    }).then(() => {
      get(ref(db, "scores")).then((scoreValue) => {
        const dataValue = scoreValue.val();

        if (Object.keys(dataValue).length > 100) {
          const scores = Object.entries(dataValue)
            .map((score) => {
              return score[1];
            })
            .sort((a, b) => b.score - a.score);

          scores.splice(-1, 1);

          const scoreData = {};

          scores.forEach((score) => {
            scoreData[score.username] = score;
          });

          set(ref(db, "scores"), scores);
        }
      });
    });
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async (username) => {
  try {
    remove(ref(db, `scores/${username}`)).then((value) => {});
  } catch (err) {
    console.log(err);
  }
};

const sendUserData = async (socket, username) => {
  try {
    get(ref(db, `scores/${username}`)).then((value) => {
      if (value.exists()) {
        const user = value.val();
        socket.emit("userData", user);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

io.on("connection", (socket) => {
  console.log("Connected...");

  socket.on("getUser", (data) => {
    // Delete user data
    // deleteData(data.username);
    sendUserData(socket, data.username);
  });

  socket.on("updateScore", async (data, callback) => {
    try {
      const value = await get(ref(db, `scores/${data.username}`));
      if (value.exists()) {
        const dataValue = value.val();
        const score = dataValue.score < data.score ? data.score : dataValue.score;
        const codeData = getCodes(data.score, dataValue.codes);
        await update(ref(db, `scores/${data.username}`), {
          score: score,
          codes: codeData.codes,
        });
        sendUserData(socket, data.username);
        callback({ ...data, unlocked: codeData.unlocked });
      } else {
        const codeData = getCodes(data.score);
        await storeData(data, codeData.codes);
        await sendUserData(socket, data.username);
        callback({ ...data, unlocked: codeData.unlocked });
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("leaderboard", () => {
    get(ref(db, "scores")).then((value) => {
      const scores = value.toJSON();
      socket.emit("leaderboard", scores || []);
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected...");
  });
});

server.listen(port, () => {
  console.log(`Listening to port ${port}...`);
});
