const commnetModel = require("../Model/comment");
const userModel = require("../Model/user");
const crypto = require("crypto");
const { CustomError } = require("../middleware/Error");

const addComment = async (req, res, next) => {
    const { malid } = req.params;
    const { userID } = req.query;
    const { comment } = req.body;
    let commentDoc;
    try {
        const commentForObject = await commnetModel.findOne({ malid });
        if (!userID) {
            throw new CustomError("Invalid user id", "InvalidUserID");
        }
        const { name: userName, image: userProfileImg } =
            await userModel.findById(userID);


        if (!commentForObject) {
            commentDoc = await commnetModel.create({
                malid,
                maincomments: 1,
                subcomments: 0,
                comments: [
                    {
                        body: comment,
                        userID,
                        userProfileImg,
                        userName,
                        date: new Date(),
                        commentID: crypto.randomBytes(7).toString("hex"),
                    },
                ],
            });
        } else {
            commentDoc = commentForObject.addComment(
                comment,
                userID,
                userName,
                userProfileImg
            );
        }

        res.status(200).json({
            messgae: "comment added successfully",
            data: {
                comments: commentDoc.comments,
                mainCommentCount: commentDoc.maincomments,
                subCommentsCount: commentDoc.subcomments,
            },
        });
    } catch (error) {
        next(error);
    }
};

const fetchComment = async (req, res) => {
    const { malid } = req.params;

    const commentDoc = await commnetModel.findOne({ malid });
    if (!commentDoc)
        return res.status(200).json({
            comments: [],
            mainCommentCount: 0,
            subCommentsCount: 0,
        });

    return res.status(200).json({
        comments: commentDoc.comments,
        mainCommentCount: commentDoc.maincomments,
        subCommentsCount: commentDoc.subcomments,
    });
};

const likeCommentHandler = async (req, res, next) => {
    const { userID, _id, malID } = req.body;
    try {
        const user = await userModel.findById(userID);

        const commentForObject = await commnetModel.findOne({ malid: malID });

        const isCommentHaveLike = user.likedComments.find(
            (comment) => comment.commentId == _id
        );

        const isCommentHaveDislike = user.dislikeComments.find(
            (comment) => comment.commentId == _id
        );

        if (!isCommentHaveLike && !isCommentHaveDislike) {
            user.addLikedComment(_id, malID);
            commentForObject.addLikeOrDislike(_id, true);
        } else if (isCommentHaveDislike) {
            user.removeComment(_id, false); 
            commentForObject.addLikeOrDislike(_id, false, "dislikeCount");

            user.addLikedComment(_id, malID); 
            commentForObject.addLikeOrDislike(_id, true); 

        } else if (isCommentHaveLike) {
            user.removeComment(_id, true);
            commentForObject.addLikeOrDislike(_id, false);
        }
        await user.save();
        await commentForObject.save();
        res.status(200).json({
            message: "success",
            userLikedComment: user.likedComments,
            userDislikedComment: user.dislikeComments,
        });
    } catch (error) {
        next(error);
    }
};
const dislikeCommentHandler = async (req, res, next) => {
    const { userID, _id, malID } = req.body;
    try {
        const user = await userModel.findOne({ _id: userID });
        const commentForObject = await commnetModel.findOne({ malid: malID });

        const isCommentHaveLike = user.likedComments.find(
            (comment) => comment.commentId == _id
        );

        const isCommentHaveDislike = user.dislikeComments.find(
            (comment) => comment.commentId == _id
        );

        if (!isCommentHaveLike && !isCommentHaveDislike) {
            user.addDislikedComment(_id, malID);
            commentForObject.addLikeOrDislike(_id, true, "dislikeCount");
        } else if (isCommentHaveLike) {
            user.removeComment(_id, true); 

            commentForObject.addLikeOrDislike(_id, false, "likeCount"); 

            user.addDislikedComment(_id, malID); 

            commentForObject.addLikeOrDislike(_id, true, "dislikeCount"); 
        } else if (isCommentHaveDislike) {
            user.removeComment(_id, false);
            commentForObject.addLikeOrDislike(_id, false, "dislikeCount");
        }

        await user.save();
        await commentForObject.save();

        res.status(200).json({
            message: "success",
            userDislikedComment: user.dislikeComments,
            userLikedComment: user.likedComments,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addComment,
    fetchComment,
    likeCommentHandler,
    dislikeCommentHandler,
};
