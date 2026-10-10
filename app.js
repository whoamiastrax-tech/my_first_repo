const express = require("express");
require("dotenv").config();
const connect = require("./db/db");
const ejs = require("ejs");
const userModel = require("./model/user");
const postModel = require("./model/post");
const msgModel = require("./model/msg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const app = express();

connect();
app.use(express.static("icons"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const port = process.env.PORT || 4000;

function isloggedIn(req, res, next) {
  try {
    let token = jwt.verify(req.cookies.token, process.env.KEY);

    req.email = token.email;
    req.userId = token.userId;

    next();
  } catch {
    res.redirect("/login");
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./icons");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err);

      cb(
        null,
        file.fieldname +
          "-" +
          raw.toString("hex") +
          path.extname(file.originalname),
      );
    });
  },
});

const upload = multer({ storage: storage });

//all get request ---------------------------------------------

app.get("/", (req, res) => {
  //   res.render("login");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  try {
    let token = jwt.verify(req.cookies.token, process.env.KEY);

    return res.redirect("/profile");
  } catch {
    res.render("login");
  }
});

app.get("/profile", isloggedIn, async (req, res) => {
  let user = await userModel.findOne({ _id: req.userId }).populate("posts");

  res.render("profile", { user });
});

app.get("/msgsection/:id", isloggedIn, async (req, res) => {


  let receiver = await userModel.findOne({ _id: req.params.id }).populate("msgSection");

  let sender = await userModel.findOne({ _id: req.userId }).populate("msgSection");

  res.render("msgsection", { sender, receiver });


});

app.get("/upload", isloggedIn, (req, res) => {
  res.render("upload");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/like/:id/:feed", isloggedIn, async (req, res) => {
  let loggedInUser = await userModel.findOne({ _id: req.userId });

  let post = await postModel.findOne({ _id: req.params.id });

  if (post.likes.indexOf(loggedInUser._id) == -1) {
    post.likes.push(loggedInUser._id);
    await post.save();

    if (req.params.feed === "profile") {
      return res.redirect("/profile");
    }
    if (req.params.feed === "feed") {
      return res.redirect(`/feed/${post.user}`);
    }
  }

  post.likes.splice(post.likes.indexOf(loggedInUser._id), 1);
  await post.save();

  if (req.params.feed === "profile") {
    return res.redirect("/profile");
  }

  if (req.params.feed === "feed") {
    return res.redirect(`/feed/${post.user}`);
  }
});

app.get("/edit/:id", isloggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  let user = await userModel.findOne({ _id: req.userId });

  res.render("edit", { user, post });
});

app.get("/allUser", isloggedIn, async (req, res) => {
  let allUser = await userModel.find();
  let loggedInUser = await userModel.findOne({ _id: req.userId });

  res.render("allUser", { allUser, loggedInUser });
});

app.get("/feed/:id", isloggedIn, async (req, res) => {
  let user = await userModel.findOne({ _id: req.params.id }).populate("posts");

  res.render("feed", { user });
});


 




//all posts api will be here
app.post("/uploadPic", isloggedIn, upload.single("image"), async (req, res) => {
  //   console.log(req.file);
  let user = await userModel.findOneAndUpdate(
    { _id: req.userId },
    { pic: req.file.filename },
  );
  res.redirect("/profile");
});

app.post("/check_username", async (req, res) => {
  // let username= req.body.username;

  let user = await userModel.findOne({ username: req.body.username });

  if (user) {
    return res.json({ taken: true });
  }

  res.json({ taken: false });
});
//registerroute
app.post("/register", async (req, res) => {
  let { name, email, password, age, username } = req.body;

  let userByusername = await userModel.findOne({ username });
  if (userByusername) return res.json({ message: "username already taken" });

  let userByemail = await userModel.findOne({ email });
  if (userByemail) return res.json({ message: "email already exists" });

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      await userModel.create({
        name,
        email,
        username,
        age,
        password: hash,
      });

      res.redirect("/login");
    });
  });
});

// login route
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });

  if (!user) return res.send("this email is not exist in db");

  bcrypt.compare(password, user.password, (err, r) => {
    if (r) {
      let token = jwt.sign({ email: email, userId: user._id }, process.env.KEY);

      res.cookie("token", token);

      return res.redirect("/profile");
    }

    res.send("invalid email or pass");
  });
});

app.post("/post", isloggedIn, async (req, res) => {
  // console.log(req.body);
  let { content } = req.body;

  const post = await postModel.create({
    content,
    user: req.userId,
  });

  let user = await userModel.findOne({ _id: req.userId });
  user.posts.push(post._id);
  await user.save();

  res.redirect("/profile");
});

app.post("/updatePost/:id", isloggedIn, async (req, res) => {
 
  

  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content },
  );

  res.redirect("/profile");
});

app.post("/sendMsg/:receiverId", isloggedIn, async (req, res) => {
  console.log(req.body.msg);
  let sender = await userModel
    .findOne({ _id: req.userId })
    .populate("msgSection");

  let receiver = await userModel
    .findOne({ _id: req.params.receiverId })
    .populate("msgSection");




  if (sender.msgSection.length === 0) {

    let msgbox = await msgModel.create({
    
      group: {
        user1: sender.username,
        user2: receiver.username,
      },
    
      message: [
        {
          msg: req.body.msg,
          user: sender.username,
        },
      ],
    });

    sender.msgSection.push(msgbox._id);
    await sender.save();
    receiver.msgSection.push(msgbox._id);
    await receiver.save();


    return res.redirect(`/msgsection/${receiver._id}`)
  }

  let flag = false;

  sender.msgSection.forEach(async (msgbox) => {
    console.log(msgbox.group.user1);
    console.log(typeof msgbox.group.user2);

    if (
      msgbox.group.user1 === receiver.username ||
      msgbox.group.user2 === receiver.username
    ) {
      flag = true;

      msgbox.message.push({
        msg: req.body.msg,
        user: sender.username,
      });

      await msgbox.save();
      console.log("dfdksfj");
      return;
    }
  });


  if(flag){     
        return res.redirect(`/msgsection/${receiver._id}`)
    // return res.render("msgsection", {sender,receiver})
  }




    let msgbox = await msgModel.create({
    
      group: {
        user1: sender.username,
        user2: receiver.username,
      },
    
      message: [
        {
          msg: req.body.msg,
          user: sender.username,
        },
      ],
    });

    sender.msgSection.push(msgbox._id);
    await sender.save();
    receiver.msgSection.push(msgbox._id);
    await receiver.save();


    // return res.render("msgsection", {sender,receiver})
        return res.redirect(`/msgsection/${receiver._id}`)




});





app.listen(port, console.log(`running on port ${port}`));
