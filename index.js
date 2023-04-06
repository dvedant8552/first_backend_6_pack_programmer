import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();

//setting view engine
app.set("view engine", "ejs");

// initializing static folder
app.use(express.static(path.join(path.resolve(), "public")));

// adding middleware for post method of form
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

mongoose
    .connect("mongodb://127.0.0.1:27017", {
        dbName: "Backend",
    })
    .then(() => console.log("database connected"))
    .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const User = mongoose.model("Users", userSchema);

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {

        const decod = jwt.verify(token, "rfbuindsnrebvijrfd");
        req.user = await User.findById(decod._id);
        console.log(req.user);

        next();
    }
    else res.redirect("/login");
};

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", { name: req.user.email });
});

app.get("/login", (req, res) => {

    res.render("login");
});
app.get("/register", (req, res) => {

    res.render("register");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if (!user) return res.redirect("/register");

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.render("login", { email: email, message: "Incorrect Password" })
    const token = jwt.sign({ _id: user._id }, "rfbuindsnrebvijrfd");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 100),
    });
    return res.redirect("/");
});

app.post("/register", async (req, res) => {

    const { email, password } = req.body;

    const hashedpassword = await bcrypt.hash(password, 10);
    const user = await User.create({
        email, password: hashedpassword
    });

    const token = jwt.sign({ _id: user._id }, "rfbuindsnrebvijrfd");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 100),
    });
    res.redirect("/login");
});

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("server is listening");
});
// app.post("/contact", async (req, res) => {
//     const {name,email}=req.body;
//     await msg.create({name,email});
//     res.redirect("/success");
// })
// app.get("/users", (req, res) => {
//     res.json({users,});
// })
// app.get("/success", (req, res) => {
//     res.render("success");
// })
