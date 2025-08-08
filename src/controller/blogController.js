const Blog = require("../model/blogSchema");
const User = require("../model/userSchema");
const Comment = require("../model/commentSchema");
const {
  uploadImage,
  deleteImagefromCloudinary,
} = require("../utils/uploadImage");
const ShortUniqueId = require("short-unique-id");
const { randomUUID } = new ShortUniqueId({ length: 20 });
const fs = require("fs");

async function createBlog(req, res) {
  try {
    const creator = req.user;
    const { title, description, draft } = req.body;
    const image = req.file;
    const findUser = await User.findById(creator);
    if (!findUser)
      return res
        .status(404)
        .json({ success: false, message: "Users Not found" });
    if (!title || !description)
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });

    // cloudinary setup
    const { secure_url, public_id } = await uploadImage(image.path);
    // image to cloudinary save to local to delete automatically
    fs.unlinkSync(image.path);
    const blogId =
      title.toLowerCase().replace(/[ /]+/g, "-") + "-" + randomUUID();

    //  const blogId1 =
    // title.toLowerCase().split(" ").join("-").split("/").join("-") +
    // "-" + randomUUID();

    const blog = await Blog.create({
      title,
      description,
      draft,
      creator,
      image: secure_url,
      imageId: public_id,
      blogId,
    });
    await User.findByIdAndUpdate(creator, { $push: { blogs: blog._id } });
    return res
      .status(201)
      .json({ success: true, message: "Blog create sucessfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}
async function getBlogs(req, res) {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const blogs = await Blog.find({ draft: false })
      .populate({
        path: "creator",
        select: "name",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalBlogs = await Blog.countDocuments({ draft: false });

    return res
      .status(200)
      .json({
        success: true,
        message: "Blog fetched successfully",
        blogs,
        hasMore: skip + limit < totalBlogs,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}

async function getBlogById(req, res) {
  try {
    const { blogId } = req.params;
    const blogs = await Blog.findOne({ blogId })
      .populate({
        path: "creator",
        select: "name email",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "name email",
        },
      });
    if (!blogs)
      return res
        .status(404)
        .json({ success: false, message: "Blog Not found" });
    return res
      .status(200)
      .json({ success: true, message: "Blog fetched successfully", blogs });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}

async function updateBlog(req, res) {
  try {
    const creator = req.user;
    const { id } = req.params;
    const { title, description, draft } = req.body;
    const image = req.file;
    const blog = await Blog.findOne({ blogId: id });
    if (!(creator == blog.creator))
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this action",
      });

    if (image) {
      await deleteImagefromCloudinary(blog.imageId);
      const { secure_url, public_id } = await uploadImage(image.path);
      blog.image = secure_url;
      blog.imageId = public_id;
      fs.unlinkSync(image.path);
    }
    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.draft = draft || blog.draft;
    await blog.save();

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error updating blog" });
  }
}

async function deleteBlog(req, res) {
  try {
    const creator = req.user;
    const { id } = req.params;
    const blog = await Blog.findById({ blogId: id });
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    if (!(creator == blog.creator))
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this action",
      });
    await deleteImagefromCloudinary(blog.imageId);

    await Blog.findByIdAndDelete(id);
    await User.findByIdAndUpdate(creator, { $pull: { blogs: id } });
    return res
      .status(200)
      .json({ success: true, message: "deleted Sucessfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Please try again",
      error: error.message,
    });
  }
}

async function likeBlog(req, res) {
  try {
    const creator = req.user;
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    if (!blog.likes.includes(creator)) {
      await Blog.findByIdAndUpdate(id, { $push: { likes: creator } });
      return res
        .status(200)
        .json({ success: true, message: "Blog Liked Successfully" });
    } else {
      await Blog.findByIdAndUpdate(id, { $pull: { likes: creator } });
      return res
        .status(200)
        .json({ success: true, message: "Blog Disliked Successfully" });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Please try again",
      error: error.message,
    });
  }
}

async function searchBlogs(req, res) {
  try {
    const { search } = req.query;
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    });
    if (blogs.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Make sure all words are spelled correctly.Try different keywords . Try more general keywords",
      });
    }
    return res.status(200).json({
      message: `Found ${blogs.length} result for  "${search}"`,
      blogs,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  likeBlog,
  searchBlogs,
};
