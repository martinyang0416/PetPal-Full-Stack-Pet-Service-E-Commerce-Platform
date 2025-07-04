import React, { useState } from 'react';
import './LoginSignup.css';
import email_icon from '../../Assets/email.png';
import user_icon from '../../Assets/user.png';
import password_icon from '../../Assets/padlock.png';
import { loginUser, signupUser } from '../../api/auth'; 
import { useNavigate } from 'react-router-dom';

const LoginSignup = () => {
  const navigate = useNavigate();
  const [action, setAction] = useState("Sign Up");
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    password: ""
  });

  const handleChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    console.log("🟡 Submitting:", formData);
    const userData = {
      user_name: formData.user_name,
      password: formData.password,
      ...(action === "Sign Up" && { email: formData.email })
    };

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (action === "Sign Up" && !emailRegex.test(formData.email)) {
    alert("❌ Please enter a valid email address.");
    return;
    }

    try {
      const data = action === "Login"
        ? await loginUser(userData)
        : await signupUser(userData);

      console.log("✅ Backend response:", data);

      if (data.msg === "Login successful!") {
        alert("✅ Login successful!");
        if (!data.has_completed_profile) {
          navigate("/new-user-form"); 
        } else {
          navigate("/home");
        }
      } else if (data.msg) {
        alert(data.msg);
      } else {
        alert("Something went wrong.");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Server error");
    }
  };

  return (
      <div className='container'>
        <div className="header">
          <div className="text">{action}</div>
          <div className="underline"></div>
        </div>

        <div className="inputs">
          <div className="input">
            <img src={user_icon} alt="user icon" />
            <input
              type="text"
              placeholder="Username"
              value={formData.user_name}
              onChange={(e) => handleChange(e, "user_name")}
            />
          </div>

          {action === "Sign Up" && (
            <div className="input">
              <img src={email_icon} alt="email icon" />
              <input
                type="email"
                placeholder="Email ID"
                value={formData.email}
                onChange={(e) => handleChange(e, "email")}
              />
            </div>
          )}

          <div className="input">
            <img src={password_icon} alt="password icon" />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleChange(e, "password")}
            />
          </div>
        </div>

        {action === "Login" && (
          <div className="forgot-password">
            Lost Password? <span>Click here</span>
          </div>
        )}

        <div className="submit-container">
          <div
            className={action === "Sign Up" ? "submit" : "submit gray"}
            onClick={() => {
              if (action === "Sign Up") handleSubmit();
              else setAction("Sign Up");
            }}
          >
            Sign Up
          </div>
          <div
            className={action === "Login" ? "submit" : "submit gray"}
            onClick={() => {
              if (action === "Login") handleSubmit();
              else setAction("Login");
            }}
          >
            Login
          </div>
        </div>
      </div>
  );
};

export default LoginSignup;
