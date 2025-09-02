import { User } from '../models/user.js';

const isProduction = process.env.NODE_ENV === "production";

const options={
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "None" : "Lax",
};
 
const GenerateToken = async (userId) => {
  console.log("userId in GenerateToken:", userId);
  
  const user = await User.findById(userId);
  console.log("Fetched user:", user._id);
  if (!user) {
    throw new Error("User not found");
  }

  const AccessToken = await user.GenerateAccessToken();
  const RefreshToken = await user.GenerateRefreshToken();

  console.log("generated Access and Refresh tokens");
  user.refreshToken = RefreshToken;
  await user.save({ validateBeforeSave: false });

  return AccessToken;
};




// Register user
const registerUser = async (req, res) => {
  console.log("a request came to register user");
  
  const { name, email, password } = req.body;

  if([name, email, password].some(field => field.trim()==='')) return res.status(400).json({ message: 'All fields are required' });

  try {

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const newUser = await User.create({ 
      name: name, 
      email: email, 
      password: password, 
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
  console.log("a request came to login user");
  const { email, password } = req.body;
  if([email, password].some(field => field.trim()==='')) return res.status(400).json({ message: 'All fields are required' });

  try {

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const AccessToken = await GenerateToken(user?._id);
    console.log('AccessToken in loginUser: ', AccessToken);
    const FetchedUser = await User.findById(user._id).select("-password -refreshToken");
    console.log('FetchedUser in loginUser: ', FetchedUser._id);
    res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .json({ message: "User logged in successfully", user: FetchedUser});

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
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
  loginUser,
  registerUser,
  LogOut,
  getCurrentUser,
  GenerateToken
}
