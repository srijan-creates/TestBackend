const User = require("../model/userSchema");
const { generateJWT, verifyJWT } = require("../utils/generateToken");
const bcrypt = require("bcrypt");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/sendEmail");

async function createUser(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !password || !email)
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });
    const checkForexitinUser = await User.findOne({ email });

    // 48---------------------------------------------
    if (checkForexitinUser) {
      if (checkForexitinUser.verify) {
        return res.status(400).json({
          success: false,
          message: "User already  registered with this email",
        });
      } else {
        let verificationtoken = await generateJWT({
          email: checkForexitinUser.email,
          id: checkForexitinUser._id,
        });
        await sendVerificationEmail(
          checkForexitinUser.email,
          verificationtoken
        );
        return res.status(200).json({
          success: true,
          message: "Please Check Your Email to verify your account",
        });
      }
    }
    let hashpassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashpassword });

    // 48
    let verificationtoken = await generateJWT({
      email: newUser.email,
      id: newUser._id,
    });

    //48  email logic
    await sendVerificationEmail(newUser.email, verificationtoken);

    return res.status(201).json({
      success: true,
      // 48
      message: "Please Check Your Email to verify your account",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}

async function userLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not registered",
      });
    }

    // Check if email is verified
    if (!existingUser.verify) {
      const verificationToken = await generateJWT({
        email: existingUser.email,
        id: existingUser._id,
      });

      await sendVerificationEmail(existingUser.email, verificationToken);

      return res.status(403).json({
        success: false,
        message: "Please verify your email. Verification link sent again.",
      });
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT for login
    const token = await generateJWT({
      email: existingUser.email,
      id: existingUser._id,
    });

    // Send response
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

async function getUser(req, res) {
  try {
    const users = await User.find();
    return res
      .status(200)
      .json({ success: true, message: "Users fetched successfully", users });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}
async function getUserId(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "User fetched successfully ", user });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Please try again" });
  }
}
async function UpdateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, password, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, password, email },
      { new: true }
    );
    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error updating user" });
  }
}
async function DeleteUser(req, res) {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully " });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Please try again" });
  }
}

// 48
async function verifyToken(req, res) {
  try {
    const { verificationToken } = req.params;
    const verifyToken = await verifyJWT(verificationToken);
    if (!verifyToken)
      return res
        .status(400)
        .json({ success: false, message: "Invalid Token/Email expired" });
    const { id } = verifyToken;
    const user = await User.findByIdAndUpdate(
      id,
      { verify: true },
      { new: true }
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Users Not found" });
    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found Please Register First",
      });
    }
    const resetToken = await generateJWT({ id: user._id, email: user.email });
    await sendResetPasswordEmail(user.email, resetToken);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
}
async function resetPassword(req, res) {
  try {
    const { resetToken } = req.params;
    console.log(resetToken);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    }

    const decoded = await verifyJWT(resetToken);
    if (!decoded) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
}
module.exports = {
  createUser,
  getUser,
  getUserId,
  UpdateUser,
  DeleteUser,
  userLogin,
  verifyToken,
  forgotPassword,
  resetPassword,
};
