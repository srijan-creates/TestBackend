const Blog = require("../model/blogSchema");
const User = require("../model/userSchema");
const Comment = require("../model/commentSchema");

async function addCommentBlog(req, res) {
  try {
    const creator = req.user;
    const { id } = req.params;
    const { comment } = req.body;
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Please enter the comment" });
    const blog = await Blog.findById(id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    const createComment = await Comment.create({
      comment,
      blog: id,
      user: creator,
    });
    const populatedComment = await createComment.populate("user", "name email");

    const addComment = await Blog.findByIdAndUpdate(id, {
      $push: { comments: createComment._id },
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Comment added Sucessfully",
        createComment: populatedComment,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Please try again",
      error: error.message,
    });
  }
}

async function deletecommentBlog(req, res) {
  try {
    const userId = req.user;
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    if (comment.user != userId && comment.blog.creator != userId)
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this action",
      });
    await Blog.findByIdAndUpdate(comment.blog._id, { $pull: { comments: id } });
    await Comment.findByIdAndDelete(id);
    res
      .status(201)
      .json({ success: true, message: "Comment deleted Sucessfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Please try again",
      error: error.message,
    });
  }
}

async function updatecommentBlog(req, res) {
  try {
    const userId = req.user;
    const { id } = req.params;
    const { comment } = req.body;
    const existingComment = await Comment.findById(id);
    if (!existingComment)
      return res
        .status(404)
        .json({ success: false, message: "Comment is not found" });
    if (existingComment.user != userId)
      return res.status(404).json({
        success: false,
        message: "Your are not validate user to edit this comment",
      });
    await Comment.findByIdAndUpdate(id, { comment }, { new: true });
    return res
      .status(200)
      .json({ success: true, message: "Comment update Sucessfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Please try again",
      error: error.message,
    });
  }
}
async function likecommentBlog(req, res) {
  try {
    const userId = req.user;
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    if (!comment.likes.includes(userId)) {
      await Comment.findByIdAndUpdate(id, { $push: { likes: userId } });
      return res
        .status(200)
        .json({ success: true, message: "Comment Liked Successfully" });
    } else {
      await Comment.findByIdAndUpdate(id, { $pull: { likes: userId } });
      return res
        .status(200)
        .json({ success: true, message: "Comment Disliked Successfully" });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Please try again",
      error: error.message,
    });
  }
}
module.exports = {
  addCommentBlog,
  deletecommentBlog,
  updatecommentBlog,
  likecommentBlog,
};
