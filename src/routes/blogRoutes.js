const express = require("express");
const route = express.Router();
const {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  searchBlogs,
} = require("../controller/blogController");
const verifyUser = require("../middleware/auth");
const {
  addCommentBlog,
  deletecommentBlog,
  updatecommentBlog,
  likecommentBlog,
} = require("../controller/commentController");
const upload = require("../utils/multer");

route.post("/blogs", verifyUser, upload.single("image"), createBlog);
route.get("/blogs", getBlogs);
route.get("/blogs/:blogId", getBlogById);
route.patch("/blogs/:id", verifyUser, upload.single("image"), updateBlog);
route.delete("/blogs/:id", verifyUser, deleteBlog);
route.post("/blogs/like/:id", verifyUser, likeBlog);
route.post("/blogs/comment/:id", verifyUser, addCommentBlog);
route.delete("/blogs/comment/:id", verifyUser, deletecommentBlog);
route.patch("/blogs/edit-comment/:id", verifyUser, updatecommentBlog);
route.post("/blogs/like-comment/:id", verifyUser, likecommentBlog);
route.get("/search-blogs", searchBlogs);

module.exports = route;
