const userModel = require("../Model/user");
const userList = require("../Model/user_list");
const jwt = require("jsonwebtoken");
const { CustomError } = require("../middleware/Error");

const login_handler = async (req, res, next) => {
    const { email, pass } = req.body;

    try {
      
        if (!email) {
            throw new CustomError("Please provide an email", "EmptyEmail");
        }

      

        if (!pass) {
            throw new CustomError("Please provide a password", "EmptyPassword");
        }

        const userData = await userModel.findOne({ email: email });

        if (!userData)
            throw new CustomError("Incorrect Email or Password", "NoAccount");

        const isPasswordSimilar = await userData.comparePassword(pass);

        if (!isPasswordSimilar)
            throw new CustomError("Incorrect Email or Password", "NoAccount");

        const token = userData.getToken();
        userData.updateLoginStatus(true);
        return res
            .status(200)
            .send({ messages: "Successfully signed in", token });
    } catch (error) {
        next(error);
    }
};

const newUser_handler = async (req, res, next) => {
    const { name, email, pass } = req.body;

    try {
        if (!name) {
            throw new CustomError(
                "Please provide an user name",
                "EmptyUsername"
            );
        }
       
        if (!email) {
            throw new CustomError("Please provide an email", "EmptyEmail");
        }

       

        if (!pass) {
            throw new CustomError("Please provide a password", "EmptyPassword");
        }
        const user = await userModel.create({
            name,
            email,
            password: pass,
            image: `${
                req.headers["x-forwarded-proto"] || "http"
            }://${req.header("Host")}/public/profile.png`,
        });

        const token = user.getToken();
        res.status(201).json({ message: "User created successfully!", token });
    } catch (error) {
        next(error);
    }
};

const authorizeUser = async (req, res) => {
    const userToken = req.headers.authorization;
    if (!userToken || !userToken.startsWith("Bearer")) {
        return res.status(401).send({ message: "No access token provided" });
    }

    try {
        const { name, userID } = jwt.verify(
            userToken.split(" ")[1],
            process.env.JWT_SECRET
        );

        const userDetails = await userModel.findById(userID);
        const { email, password, ...restUserDetails } = userDetails._doc;

        const newActivity = restUserDetails.activity.length
            ? restUserDetails.activity
                  .sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt))
                  .slice(0, 24)
            : [];

        res.status(200).json({
            user: { ...restUserDetails, activity: newActivity },
        });
    } catch (error) {
        res.status(401).send({ message: "Not authorized" });
    }
};

const logoutHandler = async (req, res, next) => {
    const { userID } = req.body;
    try {
        const userData = await userModel.findById(userID);
        userData.updateLoginStatus(false);

        return res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login_handler,
    newUser_handler,
    authorizeUser,
    logoutHandler,
};
