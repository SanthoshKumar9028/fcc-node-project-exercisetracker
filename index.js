require("dotenv").config();
const URL = require("url").URL;
let express = require("express");
const cors = require("cors");
let path = require("path");
let bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");

let app = express();

app.use((req, res, next) => {
  console.log(`\n${req.method}-------`);
  next();
});

app.use(cors());

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI);

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});

const LogSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  userId: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
});

const User = mongoose.model("User", UserSchema);
const Log = mongoose.model("Log", LogSchema);

app.get("/api/clear", async (req, res) => {
  await Log.deleteMany();
  await User.deleteMany();
  res.send("Cleared");
});

app.post("/api/users", async (req, res) => {
  const user = new User({
    username: req.body.username,
  });

  await user.save();

  res.json(user);
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();

  res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findById(req.params._id);

  const newLog = new Log({
    description: req.body.description,
    date: req.body.date,
    duration: req.body.duration,
    userId: user._id,
  });

  await newLog.save();

  const resObj = {
    _id: user._id,
    username: user.username,
    description: newLog.description,
    duration: newLog.duration,
    date: newLog.date.toDateString(),
  };

  res.json(resObj);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const user = await User.findById(req.params._id);
  const logsQuery = Log.find({
    userId: user._id,
  });

  if (req.query.from) {
    logsQuery.gte("date", new Date(req.query.from));
  }
  if (req.query.to) {
    logsQuery.lte("date", new Date(req.query.to));
  }
  if (+req.query.limit) {
    logsQuery.limit(+req.query.limit);
  }

  const logs = await logsQuery.exec();

  const resObj = {
    username: user.username,
    _id: user._id,
    count: logs.length,
    log: logs?.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString(),
    })),
  };

  console.log(resObj);
  res.json(resObj);
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
