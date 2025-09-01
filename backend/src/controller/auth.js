import { User } from '../models/user.model.js';
import { verifyGoogleToken } from '../config/google.js';
// import {redis} from '../config/redis.js'

// const options = {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//   maxAge: 24 * 60 * 60 * 1000,
// };
const options = {
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};


 
const GenerateToken = async (userId) => {
  const user = await User.findById(userId);
  const AccessToken = await user.GenerateAccessToken();
  const RefreshToken = await user.GenerateRefreshToken();

  user.refreshToken = RefreshToken;
  await user.save({ validateBeforeSave: false });

  return AccessToken;
}



// Register user
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if([name, email, password].some(field => field.trim()==='')) return res.status(400).json({ message: 'All fields are required' });

  try {

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const newUser = await User.create({ 
      name: name, 
      email: email, 
      password: password, 
      role: role ?? 'user' 
    });
    await newUser.save();

    const AccessToken = await GenerateToken(newUser?._id);
    const FetchedUser = await User.findById(newUser._id).select("-password -refreshToken");
    
    res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .json({ message: "User created successfully", user: FetchedUser,cookie:AccessToken });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Login user
const loginUser = async (req, res) => {

  const { email, password } = req.body;
  if([email, password].some(field => field.trim()==='')) return res.status(400).json({ message: 'All fields are required' });

  try {

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const AccessToken = await GenerateToken(user?._id);
    const FetchedUser = await User.findById(user._id).select("-password -refreshToken");
    res.set("Authorization", `Bearer ${AccessToken}`);
    // Also set the header in lowercase to be safe
    res.set("authorization", `Bearer ${AccessToken}`);
    res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .json({ message: "User logged in successfully", user: FetchedUser,cookie:AccessToken});

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// Google authentication
const googleAuth = async (req, res) => {
  // console.log(req.body);
  const { token } = req.body;

  try {
    const googleUser = await verifyGoogleToken(token);
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = await User.create({
        name: googleUser.given_name,
        email: googleUser.email,
        password: googleUser.sub,
        avatar: googleUser.picture,
        role: "user",
      });
      await newUser.save({ validateBeforeSave: false });
    }

    const AccessToken = await GenerateToken(user?._id);
    const FetchedUser = await User.findById(user._id).select("-password -refreshToken");
    
    res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .json({ message: "User created successfully", user: FetchedUser,cookie:AccessToken });

  } catch (err) {
    res.status(400).json({ message: 'Google authentication failed', error: err });
  }
};

// Logout user
const LogOut = async (req, res) => {
  await User.findByIdAndUpdate(
      req.user._id, 
      {refreshToken: ""}, 
      {new: true}
  );

  return res.status(200)
  .clearCookie("accessToken", options)
  .json({message: "User logged out successfully"});

}

const getCurrentUser = async(req, res)=> {
  try {
      const CurrentUser = await User.findById(req.user?._id).select("-password -refreshToken -role -avatar");
      if(!CurrentUser) return res.status(404).json({message: "User not found"});

      return res.status(200).json({user: CurrentUser});
    
  } catch (error) {
    console.log(error);
  }
}



export {
  googleAuth,
  loginUser,
  registerUser,
  LogOut,
  getCurrentUser,
  GenerateToken
}
