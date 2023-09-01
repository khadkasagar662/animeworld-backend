const { duplicateError } = require("./Error");
const validationError = require("./validationError");

const errorHandler = (err, req, res, next) => {
    if (err.name === "MongoServerError" && err.code === 11000) {
        return duplicateError(err, res);
    }
    if (err.name === "ValidationError") {
        return validationError(err, res);
    }

    const errorNames = [
        "PinnedItemLimitError",
        "EmptyUsername",
        "EmptyEmail",
        "EmptyPassword",
        "NoAccount",
        "InvalidUserID",
    ];

    if (errorNames.includes(err.name)) {
        return res.status(400).json({
            message: err.message,
            name: err.name,
        });
    }

    else {
        return res.status(500).send({ message: "an unknown error occurred" });
    }
};

module.exports = errorHandler;
