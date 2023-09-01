const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: [5, "Name is too short"],
        maxlength: [50, "Name is too long"],
        required: [true, "Please provide a name"],
    },
    email: {
        type: String,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email",
        ],
        unique: true,
        required: [true, "Please provide a email"],
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters long"],
        required: [true, "Please provide a password"],
    },
    image: {
        type: String,
    },
    bio: {
        type: String,
        maxlength: [35, "Maximum 35 characters allowed"],
        default: "",
    },
    status: {
        type: String,
        maxlength: [12, "Maximum 12 characters allowed"],
        default: "",
    },
    activity: {
        type: Array,
        default: [],
    },
    pinnedItems: {
        type: Array,
        default: [],
    },
    view: {
        type: Number,
        default: 0,
    },
    followers: {
        type: Array,
        default: [],
    },
    following: {
        type: Array,
        default: [],
    },
    likedComments: {
        type: Array,
        default: [],
    },
    dislikeComments: {
        type: Array,
        default: [],
    },
    isLoggedIn: { type: Boolean, default: true },
    lastLoggedIn: {
        type: String,
        required: true,
        default: new Date().toString(),
    },
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password") || this.isNew) {
        const salt = await bcrypt.genSalt(9);
        this.password = await bcrypt.hash(this.password, salt);
    } else {
        return next();
    }
});


userSchema.post("save", (error, doc, next) => {
    next(error);
});

userSchema.methods.getToken = function () {
    return jwt.sign(
        { userID: this._id, name: this.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_TIME }
    );
};

//*instance method to compare password
userSchema.methods.comparePassword = function (userPassword) {
    return bcrypt.compare(userPassword + "", this.password + "");
};

userSchema.methods.updateLoginStatus = function (isLoggedIn = true) {
    this.isLoggedIn = isLoggedIn;
    this.lastLoggedIn = new Date().toString();
    this.save();
};

userSchema.methods.updateProfile = function (obj) {
    const { name, bio, status, imageFilePath } = obj;

    if (name) this.name = name;
    if (bio) this.bio = bio;
    if (status) this.status = status;
    if (imageFilePath) this.image = imageFilePath;

    this.save();
    return this._doc;
};

userSchema.methods.addActivity = function (activity) {
    const { actDone, detail, doneAt } = activity;
    const tempObj = { actDone, detail, doneAt };

    const tempActivity = [...this.activity, tempObj];
    this.activity = tempActivity;
    this.save();
    return this._doc.activity;
};

userSchema.methods.pinItems = function (items) {
    this.pinnedItems = items;
    this.save();
};

//* --- instance method to add a liked comment to user's liked comments array

userSchema.methods.addLikedComment = function (_id, malid) {
    this.likedComments = [
        ...this.likedComments,
        { commentId: _id, malId: malid },
    ];
};

//* --- instance method to add a disliked comment to user's disliked comments array

userSchema.methods.addDislikedComment = function (_id, malid) {
    this.dislikeComments = [
        ...this.dislikeComments,
        { commentId: _id, malId: malid },
    ];
};

userSchema.methods.removeComment = function (_id, like) {
    if (like) {
        this.likedComments = this.likedComments.filter(
            (comment) => comment.commentId !== _id
        );
    } else if (!like) {
        this.dislikeComments = this.dislikeComments.filter(
            (comment) => comment.commentId !== _id
        );
    }
};

module.exports = mongoose.model("users", userSchema);
